import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BarrierControlDto } from './dto/barrier-control.dto';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class BarrierService {
  constructor(
    @InjectRepository(ParkingLaneEntity) private readonly laneRepository: Repository<ParkingLaneEntity>,
    @InjectRepository(ParkingSiteEntity) private readonly siteRepository: Repository<ParkingSiteEntity>,
    @InjectRepository(AuditLogEntity) private readonly auditRepository: Repository<AuditLogEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async control(laneId: string, dto: BarrierControlDto, tenantId: string, operatorId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    try {
      const site = await this.siteRepository.findOne({ where: { id: dto.site_id, tenant_id: tenantId } });
      if (!site) throw new NotFoundException('Bãi xe không thuộc doanh nghiệp hiện tại');

      const lane = await this.laneRepository.findOne({ where: { id: laneId, site_id: dto.site_id } });
      if (!lane) throw new NotFoundException('Làn xe không thuộc bãi được chỉ định');
      if (!lane.is_active) throw new BadRequestException('Làn xe hiện không hoạt động');

      const commandId = randomUUID();
      const audit = await this.auditRepository.save(this.auditRepository.create({
        tenant_id: tenantId,
        site_id: dto.site_id,
        lane_id: laneId,
        operator_id: operatorId ?? null,
        action: `BARRIER_${dto.action}`,
        outcome: 'SUCCESS',
        reason: dto.reason ?? null,
        metadata: { operator_note: dto.operator_note ?? null, command_id: commandId, lane_code: lane.lane_code },
      }));

      const payload = {
        command_id: commandId,
        tenant_id: tenantId,
        site_id: dto.site_id,
        lane_id: laneId,
        lane_code: lane.lane_code,
        action: dto.action,
        status: 'DISPATCHED',
        audit_id: audit.id,
        created_at: audit.created_at,
      };
      this.realtime.emitSite(tenantId, dto.site_id, 'cabin.event', { type: 'BARRIER_CONTROL', ...payload });
      return payload;
    } catch (error) {
      await this.auditRepository.save(this.auditRepository.create({
        tenant_id: tenantId,
        site_id: dto.site_id,
        lane_id: laneId,
        operator_id: operatorId ?? null,
        action: `BARRIER_${dto.action}`,
        outcome: 'FAILED',
        reason: error instanceof Error ? error.message : 'Barrier control failed',
        metadata: { operator_note: dto.operator_note ?? null },
      }));
      throw error;
    }
  }

  async findAudit(tenantId: string, page = 1, limit = 20) {
    const [data, total] = await this.auditRepository.findAndCount({
      where: { tenant_id: tenantId },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
      order: { created_at: 'DESC' },
    });
    return { data, meta: { page, limit, total_records: total, total_pages: Math.ceil(total / limit) } };
  }
}
