import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingFloorEntity } from '../entities/parking-floor.entity';
import { ParkingZoneEntity } from '../entities/parking-zone.entity';
import { ParkingSlotEntity } from '../entities/parking-slot.entity';
import { CreateFloorDto } from '../dto/create-floor.dto';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { UpdateSlotStatusDto } from '../dto/update-slot-status.dto';

@Injectable()
export class ParkingLayoutService {
  constructor(
    @InjectRepository(ParkingFloorEntity)
    private readonly floorRepository: Repository<ParkingFloorEntity>,
    @InjectRepository(ParkingZoneEntity)
    private readonly zoneRepository: Repository<ParkingZoneEntity>,
    @InjectRepository(ParkingSlotEntity)
    private readonly slotRepository: Repository<ParkingSlotEntity>,
  ) {}

  async createFloor(siteId: string, dto: CreateFloorDto) {
    const existing = await this.floorRepository.findOne({
      where: { site_id: siteId, floor_code: dto.floor_code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã tầng '${dto.floor_code}' đã tồn tại trong bãi xe này`);
    }

    const floor = this.floorRepository.create({
      ...dto,
      site_id: siteId,
      floor_code: dto.floor_code.toUpperCase(),
    });

    return this.floorRepository.save(floor);
  }

  async createZone(floorId: string, dto: CreateZoneDto) {
    const existing = await this.zoneRepository.findOne({
      where: { floor_id: floorId, zone_code: dto.zone_code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã khu vực '${dto.zone_code}' đã tồn tại trong tầng này`);
    }

    const zone = this.zoneRepository.create({
      ...dto,
      floor_id: floorId,
      zone_code: dto.zone_code.toUpperCase(),
    });

    return this.zoneRepository.save(zone);
  }

  async createSlot(zoneId: string, dto: CreateSlotDto) {
    const existing = await this.slotRepository.findOne({
      where: { zone_id: zoneId, slot_number: dto.slot_number.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã vị trí '${dto.slot_number}' đã tồn tại trong khu vực này`);
    }

    const slot = this.slotRepository.create({
      ...dto,
      zone_id: zoneId,
      slot_number: dto.slot_number.toUpperCase(),
      occupancy_status: 'EMPTY',
      last_status_changed_at: new Date(),
    });

    return this.slotRepository.save(slot);
  }

  async updateSlotStatus(slotId: string, dto: UpdateSlotStatusDto) {
    const slot = await this.slotRepository.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException('Không tìm thấy ô đỗ xe');
    }

    slot.occupancy_status = dto.occupancy_status;
    if (dto.vehicle_id) {
      slot.current_vehicle_id = dto.vehicle_id;
    } else if (dto.occupancy_status === 'EMPTY') {
      slot.current_vehicle_id = null as any;
    }
    slot.last_status_changed_at = new Date();

    return this.slotRepository.save(slot);
  }

  async getDigitalTwinLayout(siteId: string) {
    const floors = await this.floorRepository.find({
      where: { site_id: siteId },
      relations: ['zones', 'zones.slots'],
      order: { level_order: 'ASC' },
    });

    return floors.map((f) => ({
      floor_id: f.id,
      floor_code: f.floor_code,
      floor_name: f.floor_name,
      level_order: f.level_order,
      max_height_meters: f.max_height_meters,
      blueprint_map_url: f.blueprint_map_url,
      total_slots: f.zones?.reduce((acc, z) => acc + (z.slots?.length || 0), 0) || 0,
      occupied_slots:
        f.zones?.reduce(
          (acc, z) =>
            acc + (z.slots?.filter((s) => s.occupancy_status === 'OCCUPIED').length || 0),
          0,
        ) || 0,
      zones: f.zones?.map((z) => ({
        zone_id: z.id,
        zone_code: z.zone_code,
        zone_name: z.zone_name,
        allowed_vehicle_type: z.allowed_vehicle_type,
        capacity: z.capacity,
        slots: z.slots?.map((s) => ({
          slot_id: s.id,
          slot_number: s.slot_number,
          slot_type: s.slot_type,
          occupancy_status: s.occupancy_status,
          coordinates: s.coordinates,
          last_status_changed_at: s.last_status_changed_at,
        })),
      })),
    }));
  }
}
