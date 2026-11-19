import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationEntity } from '../entities/organization.entity';

describe('OrganizationService (Sprint 01 Unit Tests)', () => {
  let service: OrganizationService;
  let mockOrgRepository: any;

  beforeEach(async () => {
    mockOrgRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: getRepositoryToken(OrganizationEntity), useValue: mockOrgRepository },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('nên khởi tạo thành công OrganizationService', () => {
    expect(service).toBeDefined();
  });

  it('nên từ chối tạo mới khi mã doanh nghiệp đã tồn tại', async () => {
    mockOrgRepository.findOne.mockResolvedValue({ id: 'org-1', code: 'VINCOM' });

    await expect(
      service.create({
        code: 'VINCOM',
        name: 'Vincom Retail',
        contact_email: 'contact@vincom.com.vn',
        contact_phone: '19006017',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('nên tạo mới thành công doanh nghiệp khi mã duy nhất', async () => {
    mockOrgRepository.findOne.mockResolvedValue(null);
    mockOrgRepository.create.mockImplementation((dto) => dto);
    mockOrgRepository.save.mockImplementation((dto) => Promise.resolve({ id: 'uuid-vincom', ...dto }));

    const result = await service.create({
      code: 'vincom_retail',
      name: 'Vincom Retail',
      contact_email: 'contact@vincom.com.vn',
      contact_phone: '19006017',
    });

    expect(result.code).toBe('VINCOM_RETAIL');
    expect(result.subscription_status).toBe('ACTIVE');
  });

  it('nên ném NotFoundException khi không tìm thấy doanh nghiệp theo id', async () => {
    mockOrgRepository.findOne.mockResolvedValue(null);

    await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
