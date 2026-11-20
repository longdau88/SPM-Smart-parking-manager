import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParkingLaneEntity } from '../../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';
import { RecognitionEventEntity } from '../../vehicle/entities/recognition-event.entity';
import { VehicleEntity } from '../../vehicle/entities/vehicle.entity';
import { SessionStatus, PaymentStatus } from '@spm/shared-types';

@Entity('parking_sessions')
export class ParkingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'uuid', nullable: true })
  vehicle_id: string;

  @ManyToOne(() => VehicleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 32 })
  clean_plate_entry: string;

  @Column({ type: 'varchar', length: 32 })
  display_plate_entry: string;

  @Column({ type: 'timestamptz' })
  entry_time: Date;

  @Column({ type: 'uuid' })
  entry_lane_id: string;

  @ManyToOne(() => ParkingLaneEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'entry_lane_id' })
  entry_lane: ParkingLaneEntity;

  @Column({ type: 'varchar', length: 500 })
  entry_image_url: string;

  @Column({ type: 'varchar', length: 500 })
  entry_plate_crop_url: string;

  @Column({ type: 'uuid', nullable: true })
  entry_recognition_id: string;

  @ManyToOne(() => RecognitionEventEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'entry_recognition_id' })
  entry_recognition: RecognitionEventEntity;

  @Column({ type: 'varchar', length: 32, nullable: true })
  clean_plate_exit: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  display_plate_exit: string;

  @Column({ type: 'timestamptz', nullable: true })
  exit_time: Date;

  @Column({ type: 'uuid', nullable: true })
  exit_lane_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  exit_image_url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  exit_plate_crop_url: string;

  @Column({ type: 'uuid', nullable: true })
  exit_recognition_id: string;

  @ManyToOne(() => RecognitionEventEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'exit_recognition_id' })
  exit_recognition: RecognitionEventEntity;

  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  status: SessionStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  calculated_fee: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paid_fee: number;

  @Column({ type: 'varchar', length: 30, default: 'UNPAID' })
  payment_status: PaymentStatus;

  @Column({ type: 'boolean', default: false })
  is_offline_created: boolean;

  @Column({ type: 'varchar', length: 20, default: 'SYNCED' })
  edge_sync_status: 'PENDING' | 'SYNCED' | 'CONFLICT';

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
