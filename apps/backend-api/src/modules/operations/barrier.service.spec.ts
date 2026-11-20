import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BarrierService } from './barrier.service';
import { RealtimeGateway } from './realtime.gateway';

describe('BarrierService', () => {
  let service: BarrierService;
  const laneRepository = { findOne: jest.fn() };
  const siteRepository = { findOne: jest.fn() };
  const auditRepository = { create: jest.fn(), save: jest.fn(), findAndCount: jest.fn() };
  const realtime = { emitSite: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        BarrierService,
        { provide: getRepositoryToken(ParkingLaneEntity), useValue: laneRepository },
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: siteRepository },
        { provide: getRepositoryToken(AuditLogEntity), useValue: auditRepository },
        { provide: RealtimeGateway, useValue: realtime },
      ],
    }).compile();
    service = module.get(BarrierService);
    siteRepository.findOne.mockResolvedValue({ id: 'site-1', tenant_id: 'tenant-1' });
    laneRepository.findOne.mockResolvedValue({ id: 'lane-1', site_id: 'site-1', lane_code: 'L01', is_active: true });
    auditRepository.create.mockImplementation((value) => value);
    auditRepository.save.mockImplementation((value) => Promise.resolve({ id: 'audit-1', created_at: new Date(), ...value }));
  });

  it('dispatches an open command and writes a successful audit record', async () => {
    const result = await service.control('lane-1', { site_id: 'site-1', action: 'OPEN', reason: 'Thanh toán hoàn tất' }, 'tenant-1', 'staff-1');

    expect(result).toMatchObject({ lane_id: 'lane-1', action: 'OPEN', status: 'DISPATCHED' });
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: 'tenant-1',
      lane_id: 'lane-1',
      action: 'BARRIER_OPEN',
      outcome: 'SUCCESS',
      operator_id: 'staff-1',
    }));
    expect(realtime.emitSite).toHaveBeenCalledWith('tenant-1', 'site-1', 'cabin.event', expect.objectContaining({
      type: 'BARRIER_CONTROL',
      action: 'OPEN',
    }));
  });

  it('rejects a lane outside the tenant site and writes a failed audit record', async () => {
    laneRepository.findOne.mockResolvedValue(null);

    await expect(service.control('lane-x', { site_id: 'site-1', action: 'CLOSE' }, 'tenant-1', 'staff-1'))
      .rejects.toThrow(NotFoundException);
    expect(auditRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      outcome: 'FAILED',
      lane_id: 'lane-x',
    }));
  });

  it('rejects an inactive lane', async () => {
    laneRepository.findOne.mockResolvedValue({ id: 'lane-1', lane_code: 'L01', is_active: false });

    await expect(service.control('lane-1', { site_id: 'site-1', action: 'OPEN' }, 'tenant-1'))
      .rejects.toThrow(BadRequestException);
  });

  it('paginates audit logs for the tenant', async () => {
    auditRepository.findAndCount.mockResolvedValue([[{ id: 'audit-1' }], 1]);
    const result = await service.findAudit('tenant-1', 1, 20);
    expect(result).toMatchObject({ data: [{ id: 'audit-1' }], meta: { total_records: 1 } });
  });
});
