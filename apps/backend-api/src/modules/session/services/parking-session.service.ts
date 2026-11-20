import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { RecognitionEventEntity } from '../../vehicle/entities/recognition-event.entity';
import { VehicleEntity } from '../../vehicle/entities/vehicle.entity';
import { CreateEntrySessionDto } from '../dto/create-entry-session.dto';
import { ExitCheckDto } from '../dto/exit-check.dto';
import { ParkingSessionEntity } from '../entities/parking-session.entity';
import { PricingRuleService } from '../../billing/services/pricing-rule.service';
import { Optional } from '@nestjs/common';
import { RealtimeGateway } from '../../operations/realtime.gateway';

function normalizePlate(value: string) {
  return value.toUpperCase().replace(/[\s.-]/g, '');
}

function displayPlate(value: string) {
  return value.toUpperCase();
}

@Injectable()
export class ParkingSessionService {
  constructor(
    @InjectRepository(ParkingSessionEntity)
    private readonly sessionRepository: Repository<ParkingSessionEntity>,
    @InjectRepository(ParkingSiteEntity)
    private readonly siteRepository: Repository<ParkingSiteEntity>,
    @InjectRepository(ParkingLaneEntity)
    private readonly laneRepository: Repository<ParkingLaneEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(RecognitionEventEntity)
    private readonly recognitionRepository: Repository<RecognitionEventEntity>,
    private readonly pricingRuleService: PricingRuleService,
    @Optional() private readonly realtime?: RealtimeGateway,
  ) {}

  async createEntry(dto: CreateEntrySessionDto, tenantId: string) {
    await this.assertSiteAndLane(dto.site_id, dto.lane_id, tenantId);
    const cleanPlate = normalizePlate(dto.clean_plate);
    const active = await this.sessionRepository.findOne({
      where: { tenant_id: tenantId, site_id: dto.site_id, clean_plate_entry: cleanPlate, status: 'ACTIVE' },
    });
    if (active) {
      throw new ConflictException(`Phương tiện '${dto.display_plate}' đang có phiên gửi xe ACTIVE`);
    }

    const vehicle = await this.vehicleRepository.findOne({
      where: { tenant_id: tenantId, clean_plate: cleanPlate },
    });
    if (vehicle?.vehicle_status === 'BLOCKED' || vehicle?.vehicle_status === 'STOLEN_ALERT') {
      throw new UnprocessableEntityException('Phương tiện bị chặn, yêu cầu nhân viên kiểm tra thủ công');
    }

    const recognition = dto.recognition_id
      ? await this.recognitionRepository.findOne({ where: { id: dto.recognition_id, tenant_id: tenantId } })
      : null;
    if (dto.recognition_id && !recognition) {
      throw new NotFoundException('Không tìm thấy sự kiện nhận diện vào');
    }

    const session = this.sessionRepository.create({
      tenant_id: tenantId,
      site_id: dto.site_id,
      vehicle_id: vehicle?.id,
      clean_plate_entry: cleanPlate,
      display_plate_entry: displayPlate(dto.display_plate),
      entry_time: dto.entry_time ? new Date(dto.entry_time) : new Date(),
      entry_lane_id: dto.lane_id,
      entry_image_url: dto.entry_image_url,
      entry_plate_crop_url: dto.entry_plate_crop_url,
      entry_recognition_id: recognition?.id,
      status: 'ACTIVE',
      calculated_fee: 0,
      paid_fee: 0,
      payment_status: 'UNPAID',
      is_offline_created: dto.is_offline_event ?? false,
      edge_sync_status: dto.is_offline_event ? 'PENDING' : 'SYNCED',
    });
    const saved = await this.sessionRepository.save(session);
    this.realtime?.emitSite(tenantId, dto.site_id, 'cabin.event', {
      type: 'SESSION_ENTRY',
      session_id: saved.id,
      plate_number: saved.display_plate_entry,
      status: saved.status,
    });
    return {
      session_id: saved.id,
      plate_number: saved.display_plate_entry,
      vehicle_id: saved.vehicle_id,
      is_authorized: true,
      action_required: 'AUTO_OPEN_BARRIER',
      entry_time: saved.entry_time,
      status: saved.status,
    };
  }

  async exitCheck(dto: ExitCheckDto, tenantId: string) {
    await this.assertSiteAndLane(dto.site_id, dto.lane_id, tenantId);
    const cleanPlate = normalizePlate(dto.clean_plate);
    const session = await this.sessionRepository.findOne({
      where: { tenant_id: tenantId, site_id: dto.site_id, clean_plate_entry: cleanPlate, status: 'ACTIVE' },
      order: { entry_time: 'ASC' },
    });
    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên ACTIVE cho biển số '${dto.clean_plate}'`);
    }

    const exitTime = dto.exit_time ? new Date(dto.exit_time) : new Date();
    if (exitTime.getTime() < session.entry_time.getTime()) {
      throw new UnprocessableEntityException('Thời gian ra không thể trước thời gian vào');
    }
    const durationMinutes = Math.round((exitTime.getTime() - session.entry_time.getTime()) / 60000);
    const recognition = dto.recognition_id
      ? await this.recognitionRepository.findOne({ where: { id: dto.recognition_id, tenant_id: tenantId } })
      : null;
    if (dto.recognition_id && !recognition) throw new NotFoundException('Không tìm thấy sự kiện nhận diện ra');

    session.clean_plate_exit = cleanPlate;
    session.display_plate_exit = displayPlate(dto.display_plate ?? dto.clean_plate);
    session.exit_time = exitTime;
    session.exit_lane_id = dto.lane_id;
    session.exit_image_url = dto.exit_image_url;
    session.exit_plate_crop_url = dto.exit_plate_crop_url;
    session.exit_recognition_id = recognition?.id;
    session.duration_minutes = durationMinutes;
    const vehicle = session.vehicle_id
      ? await this.vehicleRepository.findOne({ where: { id: session.vehicle_id, tenant_id: tenantId } })
      : null;
    const fee = await this.pricingRuleService.calculate({
      site_id: dto.site_id,
      vehicle_type: this.toPricingVehicleType(vehicle?.vehicle_type),
      clean_plate: cleanPlate,
      entry_time: session.entry_time.toISOString(),
      exit_time: exitTime.toISOString(),
    }, tenantId);
    session.calculated_fee = fee.amount;
    session.status = 'PENDING_PAYMENT';
    session.payment_status = 'UNPAID';

    const saved = await this.sessionRepository.save(session);
    this.realtime?.emitSite(tenantId, dto.site_id, 'cabin.event', {
      type: 'SESSION_EXIT',
      session_id: saved.id,
      plate_number: saved.display_plate_exit,
      status: saved.status,
      total_fee: Number(saved.calculated_fee),
    });
    return {
      session_id: saved.id,
      matched_entry_time: saved.entry_time,
      duration_minutes: saved.duration_minutes,
      duration_text: this.formatDuration(durationMinutes),
      total_fee: saved.calculated_fee,
      tariff_applied: fee.tariff_applied,
      payment_status: saved.payment_status,
      status: saved.status,
      entry_image_url: saved.entry_image_url,
      exit_image_url: saved.exit_image_url,
    };
  }

  async findActive(siteId: string, tenantId: string, page = 1, limit = 20) {
    const [data, total] = await this.sessionRepository.findAndCount({
      where: { site_id: siteId, tenant_id: tenantId, status: 'ACTIVE' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
      order: { entry_time: 'ASC' },
    });
    return {
      data,
      meta: { page, limit, total_records: total, total_pages: Math.ceil(total / limit) },
    };
  }

  private async assertSiteAndLane(siteId: string, laneId: string, tenantId: string) {
    const site = await this.siteRepository.findOne({ where: { id: siteId, tenant_id: tenantId } });
    if (!site) throw new NotFoundException('Bãi xe không thuộc doanh nghiệp hiện tại');
    const lane = await this.laneRepository.findOne({ where: { id: laneId, site_id: siteId } });
    if (!lane) throw new NotFoundException('Làn xe không thuộc bãi được chỉ định');
  }

  private formatDuration(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return hours ? `${hours} giờ ${remaining} phút` : `${remaining} phút`;
  }

  private toPricingVehicleType(vehicleType?: string): 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'EV_CAR' {
    if (vehicleType === 'MOTORCYCLE') return 'MOTORCYCLE';
    if (vehicleType === 'TRUCK' || vehicleType === 'EV_CAR') return vehicleType;
    return 'CAR';
  }
}
