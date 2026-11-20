import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ParkingSiteService } from './parking-site.service';
import { ParkingSiteEntity } from '../entities/parking-site.entity';
import { ParkingSlotEntity } from '../entities/parking-slot.entity';

describe('ParkingSiteService (Sprint 02 Unit Tests)', () => {
  let service: ParkingSiteService;
  let mockSiteRepository: any;
  let mockSlotRepository: any;

  beforeEach(async () => {
    mockSiteRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockSlotRepository = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingSiteService,
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: mockSiteRepository },
        { provide: getRepositoryToken(ParkingSlotEntity), useValue: mockSlotRepository },
      ],
    }).compile();

    service = module.get<ParkingSiteService>(ParkingSiteService);
  });

  it('nên khởi tạo thành công ParkingSiteService', () => {
    expect(service).toBeDefined();
  });

  it('nên từ chối tạo mới khi mã bãi xe đã tồn tại trong doanh nghiệp', async () => {
    mockSiteRepository.findOne.mockResolvedValue({ id: 'site-1', code: 'PK_LM81' });

    await expect(
      service.create(
        {
          code: 'PK_LM81',
          name: 'Bãi đỗ xe Landmark 81',
          site_type: 'MALL',
          address: '720A Điện Biên Phủ, TP.HCM',
        },
        'tenant-vincom',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('nên tạo mới thành công bãi xe với mã chuẩn hóa in hoa', async () => {
    mockSiteRepository.findOne.mockResolvedValue(null);
    mockSiteRepository.create.mockImplementation((dto) => dto);
    mockSiteRepository.save.mockImplementation((dto) => Promise.resolve({ id: 'uuid-site-lm81', ...dto }));

    const result = await service.create(
      {
        code: 'pk_lm81',
        name: 'Bãi đỗ xe Landmark 81',
        site_type: 'MALL',
        address: '720A Điện Biên Phủ, TP.HCM',
        total_capacity: 1500,
      },
      'tenant-vincom',
    );

    expect(result.code).toBe('PK_LM81');
    expect(result.tenant_id).toBe('tenant-vincom');
    expect(result.is_active).toBe(true);
  });

  it('nên ném NotFoundException khi không tìm thấy bãi xe theo ID', async () => {
    mockSiteRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('non-existent-site-id')).rejects.toThrow(NotFoundException);
  });
});
