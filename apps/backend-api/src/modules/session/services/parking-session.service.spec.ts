import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { RecognitionEventEntity } from '../../vehicle/entities/recognition-event.entity';
import { VehicleEntity } from '../../vehicle/entities/vehicle.entity';
import { ParkingSessionEntity } from '../entities/parking-session.entity';
import { ParkingSessionService } from './parking-session.service';
import { PricingRuleService } from '../../billing/services/pricing-rule.service';

describe('ParkingSessionService', () => {
  let service: ParkingSessionService;
  const sessionRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), findAndCount: jest.fn() };
  const siteRepository = { findOne: jest.fn() };
  const laneRepository = { findOne: jest.fn() };
  const vehicleRepository = { findOne: jest.fn() };
  const recognitionRepository = { findOne: jest.fn() };
  const pricingRuleService = { calculate: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ParkingSessionService,
        { provide: getRepositoryToken(ParkingSessionEntity), useValue: sessionRepository },
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: siteRepository },
        { provide: getRepositoryToken(ParkingLaneEntity), useValue: laneRepository },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepository },
        { provide: getRepositoryToken(RecognitionEventEntity), useValue: recognitionRepository },
        { provide: PricingRuleService, useValue: pricingRuleService },
      ],
    }).compile();
    service = module.get(ParkingSessionService);
    siteRepository.findOne.mockResolvedValue({ id: 'site-1', tenant_id: 'tenant-1' });
    laneRepository.findOne.mockResolvedValue({ id: 'lane-1', site_id: 'site-1' });
    vehicleRepository.findOne.mockResolvedValue(null);
    pricingRuleService.calculate.mockResolvedValue({
      amount: 20000,
      tariff_applied: 'Default',
    });
    sessionRepository.create.mockImplementation((value) => value);
    sessionRepository.save.mockImplementation((value) => Promise.resolve({ id: 'session-1', ...value }));
  });

  const entry = {
    site_id: 'site-1',
    lane_id: 'lane-1',
    clean_plate: '51h-987.65',
    display_plate: '51H-987.65',
    entry_time: '2026-11-19T14:30:00.000Z',
    entry_image_url: 'https://storage.test/entry.jpg',
    entry_plate_crop_url: 'https://storage.test/plate.jpg',
  };

  it('creates an ACTIVE entry session and normalizes its plate', async () => {
    sessionRepository.findOne.mockResolvedValue(null);
    const result = await service.createEntry(entry, 'tenant-1');
    expect(result).toMatchObject({
      session_id: 'session-1',
      plate_number: '51H-987.65',
      status: 'ACTIVE',
      action_required: 'AUTO_OPEN_BARRIER',
    });
    expect(sessionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      clean_plate_entry: '51H98765',
      status: 'ACTIVE',
    }));
  });

  it('rejects a second ACTIVE session for the same vehicle at the site', async () => {
    sessionRepository.findOne.mockResolvedValue({ id: 'existing', status: 'ACTIVE' });
    await expect(service.createEntry(entry, 'tenant-1')).rejects.toThrow(ConflictException);
  });

  it('matches an active session and transitions it to PENDING_PAYMENT', async () => {
    const active = {
      id: 'session-1',
      entry_time: new Date('2026-11-19T14:30:00.000Z'),
      status: 'ACTIVE',
      calculated_fee: 0,
      payment_status: 'UNPAID',
      entry_image_url: entry.entry_image_url,
    };
    sessionRepository.findOne.mockResolvedValue(active);
    const result = await service.exitCheck({
      site_id: 'site-1',
      lane_id: 'lane-1',
      clean_plate: '51H98765',
      exit_time: '2026-11-19T18:15:00.000Z',
      exit_image_url: 'https://storage.test/exit.jpg',
    }, 'tenant-1');
    expect(result).toMatchObject({
      session_id: 'session-1',
      duration_minutes: 225,
      duration_text: '3 giờ 45 phút',
      status: 'PENDING_PAYMENT',
      payment_status: 'UNPAID',
    });
    expect(active.status).toBe('PENDING_PAYMENT');
  });

  it('rejects an exit when no active session exists', async () => {
    sessionRepository.findOne.mockResolvedValue(null);
    await expect(service.exitCheck({
      site_id: 'site-1',
      lane_id: 'lane-1',
      clean_plate: '51H98765',
      exit_image_url: 'https://storage.test/exit.jpg',
    }, 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects an exit time before entry', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      entry_time: new Date('2026-11-19T14:30:00.000Z'),
      status: 'ACTIVE',
    });
    await expect(service.exitCheck({
      site_id: 'site-1',
      lane_id: 'lane-1',
      clean_plate: '51H98765',
      exit_time: '2026-11-19T14:00:00.000Z',
      exit_image_url: 'https://storage.test/exit.jpg',
    }, 'tenant-1')).rejects.toThrow(UnprocessableEntityException);
  });
});
