import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleEntity } from '../entities/vehicle.entity';

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s.-]/g, '');
}

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async create(dto: CreateVehicleDto, tenantId: string) {
    const cleanPlate = normalizePlate(dto.clean_plate);
    const existing = await this.vehicleRepository.findOne({
      where: { tenant_id: tenantId, clean_plate: cleanPlate },
    });

    if (existing) {
      throw new ConflictException(`Biển số '${dto.clean_plate}' đã tồn tại trong doanh nghiệp`);
    }

    return this.vehicleRepository.save(this.vehicleRepository.create({
      ...dto,
      tenant_id: tenantId,
      clean_plate: cleanPlate,
      display_plate: dto.display_plate?.toUpperCase() ?? dto.clean_plate.toUpperCase(),
      vehicle_status: 'ACTIVE',
    }));
  }

  async findAll(tenantId: string | undefined, page = 1, limit = 20, query?: string) {
    const builder = this.vehicleRepository.createQueryBuilder('vehicle')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('vehicle.created_at', 'DESC');

    if (tenantId) builder.where('vehicle.tenant_id = :tenantId', { tenantId });
    if (query) {
      builder.andWhere('(vehicle.clean_plate ILIKE :query OR vehicle.display_plate ILIKE :query)', {
        query: `%${normalizePlate(query)}%`,
      });
    }

    const [data, total] = await builder.getManyAndCount();
    return {
      data,
      meta: { page, limit, total_records: total, total_pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, tenantId?: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: tenantId ? { id, tenant_id: tenantId } : { id },
    });
    if (!vehicle) throw new NotFoundException('Không tìm thấy phương tiện');
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, tenantId?: string) {
    const vehicle = await this.findById(id, tenantId);
    const { clean_plate, display_plate, ...updates } = dto;
    if (clean_plate) {
      const cleanPlate = normalizePlate(clean_plate);
      if (cleanPlate !== vehicle.clean_plate) {
        const duplicate = await this.vehicleRepository.findOne({
          where: { tenant_id: vehicle.tenant_id, clean_plate: cleanPlate },
        });
        if (duplicate) throw new ConflictException(`Biển số '${clean_plate}' đã tồn tại`);
        vehicle.clean_plate = cleanPlate;
      }
    }
    Object.assign(vehicle, updates);
    if (display_plate) vehicle.display_plate = display_plate.toUpperCase();
    return this.vehicleRepository.save(vehicle);
  }
}
