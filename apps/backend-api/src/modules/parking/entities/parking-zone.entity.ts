import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ParkingFloorEntity } from './parking-floor.entity';
import { ParkingSlotEntity } from './parking-slot.entity';

@Entity('parking_zones')
@Unique(['floor_id', 'zone_code'])
export class ParkingZoneEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  floor_id: string;

  @ManyToOne(() => ParkingFloorEntity, (floor) => floor.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'floor_id' })
  floor: ParkingFloorEntity;

  @Column({ type: 'varchar', length: 30 })
  zone_code: string;

  @Column({ type: 'varchar', length: 100 })
  zone_name: string;

  @Column({ type: 'varchar', length: 30, default: 'CAR' })
  allowed_vehicle_type: 'CAR' | 'MOTORBIKE' | 'TRUCK' | 'EV_CAR';

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @OneToMany(() => ParkingSlotEntity, (slot) => slot.zone, { cascade: true })
  slots: ParkingSlotEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
