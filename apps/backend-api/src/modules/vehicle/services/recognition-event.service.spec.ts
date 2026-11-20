import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { CreateRecognitionEventDto } from '../dto/create-recognition-event.dto';
import { RecognitionEventEntity } from '../entities/recognition-event.entity';
import { VehicleEntity } from '../entities/vehicle.entity';
import { RecognitionEventService } from './recognition-event.service';

describe('RecognitionEventService', () => {
  let service: RecognitionEventService;
  const eventRepository = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const vehicleRepository = { findOne: jest.fn() };
  const laneRepository = { findOne: jest.fn() };
  const siteRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        RecognitionEventService,
        { provide: getRepositoryToken(RecognitionEventEntity), useValue: eventRepository },
        { provide: getRepositoryToken(VehicleEntity), useValue: vehicleRepository },
        { provide: getRepositoryToken(ParkingLaneEntity), useValue: laneRepository },
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: siteRepository },
      ],
    }).compile();
    service = module.get(RecognitionEventService);
  });

  const dto: CreateRecognitionEventDto = {
    site_id: 'site-1',
    lane_id: 'lane-1',
    direction: 'IN',
    clean_plate: '51h-987.65',
    confidence_score: 98.4,
    raw_image_url: 'https://storage/vehicle.jpg',
    cropped_plate_url: 'https://storage/plate.jpg',
    inference_time_ms: 55,
    ai_model_version: 'model-v1',
  };

  it('rejects events from a lane outside the requested site', async () => {
    siteRepository.findOne.mockResolvedValue({ id: 'site-1', tenant_id: 'tenant-1' });
    laneRepository.findOne.mockResolvedValue(null);
    await expect(service.create(dto, 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('normalizes the plate and returns matched vehicle action', async () => {
    siteRepository.findOne.mockResolvedValue({ id: 'site-1', tenant_id: 'tenant-1' });
    laneRepository.findOne.mockResolvedValue({ id: 'lane-1', site_id: 'site-1' });
    eventRepository.create.mockImplementation((value) => value);
    eventRepository.save.mockImplementation((value) => Promise.resolve({ id: 'event-1', ...value }));
    vehicleRepository.findOne.mockResolvedValue({ id: 'vehicle-1', vehicle_status: 'BLOCKED' });

    const result = await service.create(dto, 'tenant-1');

    expect(result.action).toBe('MANUAL_REVIEW');
    expect(result.event.recognized_clean_plate).toBe('51H98765');
    expect(result.matched_vehicle.id).toBe('vehicle-1');
  });
});
