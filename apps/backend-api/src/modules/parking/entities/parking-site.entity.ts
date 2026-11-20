import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SiteType } from '@spm/shared-types';
import { OrganizationEntity } from '../../organization/entities/organization.entity';
import { ParkingFloorEntity } from './parking-floor.entity';
import { ParkingLaneEntity } from './parking-lane.entity';

@Entity('parking_sites')
@Unique(['tenant_id', 'code'])
export class ParkingSiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: OrganizationEntity;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'MALL' })
  site_type: SiteType;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'double precision', nullable: true })
  latitude: number;

  @Column({ type: 'double precision', nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 0 })
  total_capacity: number;

  @Column({ type: 'int', default: 0 })
  car_capacity: number;

  @Column({ type: 'int', default: 0 })
  motorcycle_capacity: number;

  @Column({
    type: 'jsonb',
    default: { open: '00:00', close: '23:59', is_24_7: true },
  })
  operating_hours: { open: string; close: string; is_24_7: boolean };

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => ParkingFloorEntity, (floor) => floor.site, { cascade: true })
  floors: ParkingFloorEntity[];

  @OneToMany(() => ParkingLaneEntity, (lane) => lane.site, { cascade: true })
  lanes: ParkingLaneEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
