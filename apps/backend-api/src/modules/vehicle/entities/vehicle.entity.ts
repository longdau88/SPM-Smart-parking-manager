import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleType } from '@spm/shared-types';
import { OrganizationEntity } from '../../organization/entities/organization.entity';

@Entity('vehicles')
@Unique(['tenant_id', 'clean_plate'])
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  owner_user_id: string;

  @Column({ type: 'varchar', length: 30 })
  clean_plate: string;

  @Column({ type: 'varchar', length: 30 })
  display_plate: string;

  @Column({ type: 'varchar', length: 30 })
  vehicle_type: VehicleType;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  vehicle_status: 'ACTIVE' | 'BLOCKED' | 'STOLEN_ALERT';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
