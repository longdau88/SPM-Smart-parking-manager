import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';

export type TariffModel = 'FLAT' | 'HOURLY_PROGRESSIVE' | 'TIME_BLOCK' | 'OVERNIGHT';

export interface RatesDefinition {
  amount?: number;
  hourly_rate?: number;
  first_hour_rate?: number;
  additional_hour_rate?: number;
  block_minutes?: number;
  block_rate?: number;
  overnight_fee?: number;
  overnight_start_hour?: number;
}

@Entity('pricing_rules')
export class PricingRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'varchar', length: 100 })
  rule_name: string;

  @Column({ type: 'varchar', length: 30 })
  vehicle_type: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'EV_CAR';

  @Column({ type: 'varchar', length: 30 })
  tariff_model: TariffModel;

  @Column({ type: 'int', default: 15 })
  grace_period_minutes: number;

  @Column({ type: 'jsonb' })
  rates_definition: RatesDefinition;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
