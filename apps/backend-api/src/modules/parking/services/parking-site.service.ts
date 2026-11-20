import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingSiteEntity } from '../entities/parking-site.entity';
import { ParkingSlotEntity } from '../entities/parking-slot.entity';
import { CreateParkingSiteDto } from '../dto/create-parking-site.dto';
import { UpdateParkingSiteDto } from '../dto/update-parking-site.dto';

@Injectable()
export class ParkingSiteService {
  constructor(
    @InjectRepository(ParkingSiteEntity)
    private readonly siteRepository: Repository<ParkingSiteEntity>,
    @InjectRepository(ParkingSlotEntity)
    private readonly slotRepository: Repository<ParkingSlotEntity>,
  ) {}

  async create(dto: CreateParkingSiteDto, tenantId: string) {
    const existing = await this.siteRepository.findOne({
      where: { tenant_id: tenantId, code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã bãi xe '${dto.code}' đã tồn tại trong doanh nghiệp`);
    }

    const site = this.siteRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
      tenant_id: tenantId,
      is_active: true,
    });

    return this.siteRepository.save(site);
  }

  async findAll(tenantId?: string, page = 1, limit = 20) {
    const qb = this.siteRepository
      .createQueryBuilder('site')
      .leftJoinAndSelect('site.tenant', 'tenant')
      .leftJoinAndSelect('site.lanes', 'lanes')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('site.created_at', 'DESC');

    if (tenantId) {
      qb.andWhere('site.tenant_id = :tenantId', { tenantId });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const site = await this.siteRepository.findOne({
      where: { id },
      relations: ['tenant', 'floors', 'floors.zones', 'lanes'],
    });

    if (!site) {
      throw new NotFoundException('Không tìm thấy cơ sở bãi đỗ xe');
    }

    return site;
  }

  async update(id: string, dto: UpdateParkingSiteDto) {
    const site = await this.findById(id);

    if (dto.code && dto.code.toUpperCase() !== site.code) {
      const existing = await this.siteRepository.findOne({
        where: { tenant_id: site.tenant_id, code: dto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(`Mã bãi xe '${dto.code}' đã tồn tại`);
      }
      site.code = dto.code.toUpperCase();
    }

    Object.assign(site, dto);
    return this.siteRepository.save(site);
  }

  async getOccupancy(siteId: string) {
    const site = await this.findById(siteId);

    // Count slot states in this site
    const stats = await this.slotRepository
      .createQueryBuilder('slot')
      .innerJoin('slot.zone', 'zone')
      .innerJoin('zone.floor', 'floor')
      .where('floor.site_id = :siteId', { siteId })
      .select('slot.occupancy_status', 'status')
      .addSelect('COUNT(slot.id)', 'count')
      .groupBy('slot.occupancy_status')
      .getRawMany();

    const counts: Record<string, number> = {
      EMPTY: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      MAINTENANCE: 0,
    };

    for (const s of stats) {
      counts[s.status] = parseInt(s.count, 10);
    }

    const totalSlots = Object.values(counts).reduce((a, b) => a + b, 0);
    const occupancyRate = totalSlots > 0 ? ((counts.OCCUPIED / totalSlots) * 100).toFixed(1) : '0.0';

    return {
      site_id: site.id,
      site_name: site.name,
      total_capacity: site.total_capacity || totalSlots,
      slots_registered: totalSlots,
      empty_slots: counts.EMPTY,
      occupied_slots: counts.OCCUPIED,
      reserved_slots: counts.RESERVED,
      maintenance_slots: counts.MAINTENANCE,
      occupancy_rate_percent: parseFloat(occupancyRate),
    };
  }
}
