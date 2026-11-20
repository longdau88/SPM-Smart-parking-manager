import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrganizationEntity } from '../../organization/entities/organization.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';

@Entity('recognition_logs')
export class RecognitionEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true, unique: true })
  edge_event_id: string | null;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: OrganizationEntity;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'uuid' })
  lane_id: string;

  @ManyToOne(() => ParkingLaneEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lane_id' })
  lane: ParkingLaneEntity;

  @Column({ type: 'varchar', length: 10 })
  direction: 'IN' | 'OUT';

  @Column({ type: 'varchar', length: 30 })
  recognized_clean_plate: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  recognized_display_plate: string;

  @Column({ type: 'double precision' })
  confidence_score: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  detected_vehicle_type: string;

  @Column({ type: 'text' })
  raw_image_url: string;

  @Column({ type: 'text' })
  cropped_plate_url: string;

  @Column({ type: 'int' })
  inference_time_ms: number;

  @Column({ type: 'varchar', length: 100 })
  ai_model_version: string;

  @Column({ type: 'boolean', default: false })
  is_manually_corrected: boolean;

  @Column({ type: 'varchar', length: 30, nullable: true })
  corrected_plate: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
