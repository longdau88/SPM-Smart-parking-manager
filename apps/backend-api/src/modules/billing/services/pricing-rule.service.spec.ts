import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { PricingRuleEntity } from '../entities/pricing-rule.entity';
import { PricingRuleService } from './pricing-rule.service';

describe('PricingRuleService', () => {
  let service: PricingRuleService;
  const ruleRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const siteRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PricingRuleService,
        { provide: getRepositoryToken(PricingRuleEntity), useValue: ruleRepository },
        { provide: getRepositoryToken(ParkingSiteEntity), useValue: siteRepository },
      ],
    }).compile();
    service = module.get(PricingRuleService);
  });

  it('calculates a grace-period fee as zero', () => {
    const rule = {
      tariff_model: 'TIME_BLOCK',
      grace_period_minutes: 15,
      rates_definition: { block_minutes: 60, block_rate: 20000 },
    } as PricingRuleEntity;
    expect(service.calculateAmount(rule, 15, new Date(), new Date())).toBe(0);
  });

  it('calculates progressive blocks and rounds up partial blocks', () => {
    const rule = {
      tariff_model: 'TIME_BLOCK',
      grace_period_minutes: 15,
      rates_definition: { block_minutes: 30, block_rate: 10000 },
    } as PricingRuleEntity;
    expect(service.calculateAmount(rule, 61, new Date(), new Date())).toBe(30000);
  });

  it('rejects invalid pricing rates', async () => {
    siteRepository.findOne.mockResolvedValue({ id: 'site-1', tenant_id: 'tenant-1' });
    await expect(service.create({
      site_id: 'site-1',
      rule_name: 'Invalid',
      vehicle_type: 'CAR',
      tariff_model: 'TIME_BLOCK',
      rates_definition: { block_minutes: 0, block_rate: 1000 },
    }, 'tenant-1')).rejects.toThrow(BadRequestException);
  });
});
