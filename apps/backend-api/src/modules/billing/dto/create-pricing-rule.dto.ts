import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { RatesDefinition, TariffModel } from '../entities/pricing-rule.entity';

export class CreatePricingRuleDto {
  @ApiProperty()
  @IsUUID()
  site_id: string;

  @ApiProperty({ example: 'Ngày thường - Ô tô' })
  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @ApiProperty({ enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'EV_CAR'] })
  @IsEnum(['CAR', 'MOTORCYCLE', 'TRUCK', 'EV_CAR'])
  vehicle_type: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'EV_CAR';

  @ApiProperty({ enum: ['FLAT', 'HOURLY_PROGRESSIVE', 'TIME_BLOCK', 'OVERNIGHT'] })
  @IsEnum(['FLAT', 'HOURLY_PROGRESSIVE', 'TIME_BLOCK', 'OVERNIGHT'])
  tariff_model: TariffModel;

  @ApiProperty({ default: 15 })
  @IsInt()
  @Min(0)
  @IsOptional()
  grace_period_minutes?: number;

  @ApiProperty({ example: { block_minutes: 60, block_rate: 20000 } })
  @IsObject()
  rates_definition: RatesDefinition;

  @ApiProperty({ default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;
}
