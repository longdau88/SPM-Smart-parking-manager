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
import { ParkingZoneEntity } from './parking-zone.entity';

@Entity('parking_slots')
@Unique(['zone_id', 'slot_number'])
export class ParkingSlotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  zone_id: string;

  @ManyToOne(() => ParkingZoneEntity, (zone) => zone.slots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zone_id' })
  zone: ParkingZoneEntity;

  @Column({ type: 'varchar', length: 30 })
  slot_number: string;

  @Column({ type: 'varchar', length: 30, default: 'STANDARD' })
  slot_type: 'STANDARD' | 'VIP' | 'HANDICAPPED' | 'EV_CHARGING';

  @Column({ type: 'varchar', length: 30, default: 'EMPTY' })
  occupancy_status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

  @Column({ type: 'uuid', nullable: true })
  sensor_device_id: string;

  @Column({ type: 'uuid', nullable: true })
  current_vehicle_id: string;

  @Column({ type: 'jsonb', nullable: true })
  coordinates: { x: number; y: number; polygon?: number[][] };

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  last_status_changed_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
