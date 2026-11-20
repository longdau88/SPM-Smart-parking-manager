import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { VehicleEntity } from '../entities/vehicle.entity';
import { VehicleService } from './vehicle.service';

describe('VehicleService', () => {
  let service: VehicleService;
  const repository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        VehicleService,
        { provide: getRepositoryToken(VehicleEntity), useValue: repository },
      ],
    }).compile();
    service = module.get(VehicleService);
  });

  it('normalizes plates and rejects duplicate tenant plates', async () => {
    repository.findOne.mockResolvedValue({ id: 'existing' });

    await expect(service.create({
      clean_plate: '51h-987.65',
      vehicle_type: 'CAR_SEDAN',
    }, 'tenant-1')).rejects.toThrow(ConflictException);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { tenant_id: 'tenant-1', clean_plate: '51H98765' },
    });
  });

  it('creates an active vehicle with a display plate', async () => {
    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation((value) => value);
    repository.save.mockImplementation((value) => Promise.resolve(value));

    const result = await service.create({
      clean_plate: '51h-987.65',
      vehicle_type: 'CAR_SEDAN',
    }, 'tenant-1');

    expect(result).toMatchObject({
      tenant_id: 'tenant-1',
      clean_plate: '51H98765',
      display_plate: '51H-987.65',
      vehicle_status: 'ACTIVE',
    });
  });
});
