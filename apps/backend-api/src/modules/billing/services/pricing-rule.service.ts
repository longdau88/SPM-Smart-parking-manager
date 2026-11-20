import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { CalculateFeeDto } from '../dto/calculate-fee.dto';
import { PricingRuleEntity, RatesDefinition } from '../entities/pricing-rule.entity';

@Injectable()
export class PricingRuleService {
  constructor(
    @InjectRepository(PricingRuleEntity)
    private readonly ruleRepository: Repository<PricingRuleEntity>,
    @InjectRepository(ParkingSiteEntity)
    private readonly siteRepository: Repository<ParkingSiteEntity>,
  ) {}

  async create(dto: CreatePricingRuleDto, tenantId: string) {
    const site = await this.siteRepository.findOne({ where: { id: dto.site_id, tenant_id: tenantId } });
    if (!site) throw new NotFoundException('Bãi xe không thuộc doanh nghiệp hiện tại');
    this.validateRates(dto.tariff_model, dto.rates_definition);
    const duplicate = await this.ruleRepository.findOne({
      where: { tenant_id: tenantId, site_id: dto.site_id, rule_name: dto.rule_name },
    });
    if (duplicate) throw new ConflictException(`Quy tắc '${dto.rule_name}' đã tồn tại`);
    return this.ruleRepository.save(this.ruleRepository.create({
      ...dto,
      tenant_id: tenantId,
      grace_period_minutes: dto.grace_period_minutes ?? 15,
      priority: dto.priority ?? 1,
      is_active: true,
    }));
  }

  async findBySite(siteId: string, tenantId: string) {
    return this.ruleRepository.find({
      where: { site_id: siteId, tenant_id: tenantId },
      order: { priority: 'ASC', created_at: 'DESC' },
    });
  }

  async calculate(dto: CalculateFeeDto, tenantId: string) {
    const rule = await this.ruleRepository.findOne({
      where: { site_id: dto.site_id, tenant_id: tenantId, vehicle_type: dto.vehicle_type, is_active: true },
      order: { priority: 'ASC' },
    });
    if (!rule) throw new NotFoundException(`Chưa cấu hình biểu phí cho loại xe ${dto.vehicle_type}`);
    const entry = new Date(dto.entry_time);
    const exit = new Date(dto.exit_time);
    if (exit.getTime() < entry.getTime()) throw new BadRequestException('Thời gian ra không hợp lệ');
    const durationMinutes = Math.round((exit.getTime() - entry.getTime()) / 60000);
    const amount = this.calculateAmount(rule, durationMinutes, entry, exit);
    return {
      pricing_rule_id: rule.id,
      tariff_applied: rule.rule_name,
      duration_minutes: durationMinutes,
      amount,
      currency: 'VND',
      clean_plate: dto.clean_plate.toUpperCase().replace(/[\s.-]/g, ''),
    };
  }

  calculateAmount(rule: PricingRuleEntity, durationMinutes: number, entry: Date, exit: Date) {
    if (durationMinutes <= rule.grace_period_minutes) return 0;
    const rates = rule.rates_definition;
    switch (rule.tariff_model) {
      case 'FLAT':
        return this.requiredRate(rates.amount, 'amount');
      case 'TIME_BLOCK': {
        const blockMinutes = this.requiredRate(rates.block_minutes, 'block_minutes');
        const blockRate = this.requiredRate(rates.block_rate, 'block_rate');
        return Math.ceil(durationMinutes / blockMinutes) * blockRate;
      }
      case 'HOURLY_PROGRESSIVE': {
        const hours = Math.ceil(durationMinutes / 60);
        const first = rates.first_hour_rate ?? rates.hourly_rate;
        const additional = rates.additional_hour_rate ?? rates.hourly_rate;
        return this.requiredRate(first, 'first_hour_rate') + Math.max(0, hours - 1) * this.requiredRate(additional, 'additional_hour_rate');
      }
      case 'OVERNIGHT': {
        const overnightFee = this.requiredRate(rates.overnight_fee, 'overnight_fee');
        const crossesDate = entry.toDateString() !== exit.toDateString();
        return crossesDate ? overnightFee : this.calculateHourly(rates, durationMinutes);
      }
    }
  }

  private calculateHourly(rates: RatesDefinition, durationMinutes: number) {
    const hours = Math.ceil(durationMinutes / 60);
    return hours * this.requiredRate(rates.hourly_rate, 'hourly_rate');
  }

  private requiredRate(value: number | undefined, field: string) {
    if (value === undefined || !Number.isFinite(value) || value < 0) {
      throw new BadRequestException(`rates_definition.${field} phải là số không âm`);
    }
    return value;
  }

  private validateRates(model: PricingRuleEntity['tariff_model'], rates: RatesDefinition) {
    if (model === 'FLAT') this.requiredRate(rates.amount, 'amount');
    if (model === 'TIME_BLOCK') {
      this.requiredRate(rates.block_minutes, 'block_minutes');
      this.requiredRate(rates.block_rate, 'block_rate');
      if (!rates.block_minutes || rates.block_minutes <= 0) throw new BadRequestException('block_minutes phải lớn hơn 0');
    }
    if (model === 'HOURLY_PROGRESSIVE') {
      this.requiredRate(rates.first_hour_rate ?? rates.hourly_rate, 'first_hour_rate');
      this.requiredRate(rates.additional_hour_rate ?? rates.hourly_rate, 'additional_hour_rate');
    }
    if (model === 'OVERNIGHT') this.requiredRate(rates.overnight_fee, 'overnight_fee');
  }
}
