import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ParkingLayoutService } from './parking-layout.service';
import { ParkingFloorEntity } from '../entities/parking-floor.entity';
import { ParkingZoneEntity } from '../entities/parking-zone.entity';
import { ParkingSlotEntity } from '../entities/parking-slot.entity';

describe('ParkingLayoutService (Sprint 02 Unit Tests)', () => {
  let service: ParkingLayoutService;
  let mockFloorRepository: any;
  let mockZoneRepository: any;
  let mockSlotRepository: any;

  beforeEach(async () => {
    mockFloorRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockZoneRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockSlotRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingLayoutService,
        { provide: getRepositoryToken(ParkingFloorEntity), useValue: mockFloorRepository },
        { provide: getRepositoryToken(ParkingZoneEntity), useValue: mockZoneRepository },
        { provide: getRepositoryToken(ParkingSlotEntity), useValue: mockSlotRepository },
      ],
    }).compile();

    service = module.get<ParkingLayoutService>(ParkingLayoutService);
  });

  it('nên khởi tạo thành công ParkingLayoutService', () => {
    expect(service).toBeDefined();
  });

  it('nên tạo tầng đỗ xe mới thành công', async () => {
    mockFloorRepository.findOne.mockResolvedValue(null);
    mockFloorRepository.create.mockImplementation((dto) => dto);
    mockFloorRepository.save.mockImplementation((dto) => Promise.resolve({ id: 'uuid-b1', ...dto }));

    const result = await service.createFloor('site-lm81', {
      floor_code: 'b1',
      floor_name: 'Tầng Hầm B1',
      level_order: -1,
      max_height_meters: 2.2,
    });

    expect(result.floor_code).toBe('B1');
    expect(result.site_id).toBe('site-lm81');
  });

  it('nên từ chối tạo tầng khi mã tầng đã tồn tại trong bãi', async () => {
    mockFloorRepository.findOne.mockResolvedValue({ id: 'floor-1', floor_code: 'B1' });

    await expect(
      service.createFloor('site-lm81', { floor_code: 'B1', floor_name: 'Tầng Hầm B1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('nên cập nhật trạng thái ô đỗ thành công khi cảm biến gửi tín hiệu', async () => {
    mockSlotRepository.findOne.mockResolvedValue({
      id: 'slot-1',
      slot_number: 'B1-A01',
      occupancy_status: 'EMPTY',
    });
    mockSlotRepository.save.mockImplementation((slot) => Promise.resolve(slot));

    const result = await service.updateSlotStatus('slot-1', {
      occupancy_status: 'OCCUPIED',
      vehicle_id: 'uuid-car-1',
    });

    expect(result.occupancy_status).toBe('OCCUPIED');
    expect(result.current_vehicle_id).toBe('uuid-car-1');
  });
});
