import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { LaneType, LaneOperatingMode } from '@spm/shared-types';
import { ParkingSiteEntity } from './parking-site.entity';

@Entity('parking_lanes')
@Unique(['site_id', 'lane_code'])
export class ParkingLaneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, (site) => site.lanes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'uuid', nullable: true })
  edge_node_id: string;

  @Column({ type: 'varchar', length: 30 })
  lane_code: string;

  @Column({ type: 'varchar', length: 100 })
  lane_name: string;

  @Column({ type: 'varchar', length: 30, default: 'ENTRY' })
  lane_type: LaneType;

  @Column({ type: 'varchar', length: 30, default: 'AUTO_AI' })
  operating_mode: LaneOperatingMode;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
