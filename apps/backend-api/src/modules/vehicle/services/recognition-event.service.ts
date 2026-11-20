import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRecognitionEventDto } from '../dto/create-recognition-event.dto';
import { RecognitionEventEntity } from '../entities/recognition-event.entity';
import { VehicleEntity } from '../entities/vehicle.entity';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s.-]/g, '');
}

@Injectable()
export class RecognitionEventService {
  constructor(
    @InjectRepository(RecognitionEventEntity)
    private readonly eventRepository: Repository<RecognitionEventEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(ParkingLaneEntity)
    private readonly laneRepository: Repository<ParkingLaneEntity>,
    @InjectRepository(ParkingSiteEntity)
    private readonly siteRepository: Repository<ParkingSiteEntity>,
  ) {}

  async create(dto: CreateRecognitionEventDto, tenantId: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context cho sự kiện nhận diện');
    if (dto.edge_event_id) {
      const existing = await this.eventRepository.findOne({ where: { edge_event_id: dto.edge_event_id, tenant_id: tenantId } });
      if (existing) {
        const vehicle = await this.vehicleRepository.findOne({ where: { tenant_id: tenantId, clean_plate: existing.recognized_clean_plate } });
        return {
          event: existing,
          matched_vehicle: vehicle ?? null,
          action: vehicle?.vehicle_status === 'BLOCKED' ? 'MANUAL_REVIEW' : 'CONTINUE',
        };
      }
    }
    const site = await this.siteRepository.findOne({
      where: { id: dto.site_id, tenant_id: tenantId },
    });
    if (!site) throw new NotFoundException('Bãi xe không thuộc doanh nghiệp hiện tại');
    const lane = await this.laneRepository.findOne({
      where: { id: dto.lane_id, site_id: dto.site_id },
    });
    if (!lane) throw new NotFoundException('Làn xe không thuộc bãi được chỉ định');

    const cleanPlate = normalizePlate(dto.corrected_plate ?? dto.clean_plate);
    const event = this.eventRepository.create({
      edge_event_id: dto.edge_event_id ?? null,
      tenant_id: tenantId,
      site_id: dto.site_id,
      lane_id: dto.lane_id,
      direction: dto.direction,
      recognized_clean_plate: cleanPlate,
      recognized_display_plate: (dto.display_plate ?? dto.clean_plate).toUpperCase(),
      confidence_score: dto.confidence_score,
      detected_vehicle_type: dto.detected_vehicle_type,
      raw_image_url: dto.raw_image_url,
      cropped_plate_url: dto.cropped_plate_url,
      inference_time_ms: dto.inference_time_ms,
      ai_model_version: dto.ai_model_version,
      is_manually_corrected: dto.is_manually_corrected ?? Boolean(dto.corrected_plate),
      corrected_plate: dto.corrected_plate ? normalizePlate(dto.corrected_plate) : undefined,
    });

    const vehicle = await this.vehicleRepository.findOne({
      where: { tenant_id: tenantId, clean_plate: cleanPlate },
    });

    return {
      event: await this.eventRepository.save(event),
      matched_vehicle: vehicle ?? null,
      action: vehicle?.vehicle_status === 'BLOCKED' ? 'MANUAL_REVIEW' : 'CONTINUE',
    };
  }

  async findRecent(siteId: string, tenantId?: string, limit = 50) {
    const where = tenantId ? { site_id: siteId, tenant_id: tenantId } : { site_id: siteId };
    return this.eventRepository.find({
      where,
      order: { created_at: 'DESC' },
      take: Math.min(limit, 100),
    });
  }
}
