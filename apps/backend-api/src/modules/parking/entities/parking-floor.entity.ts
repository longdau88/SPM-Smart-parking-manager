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
import { ParkingSiteEntity } from './parking-site.entity';
import { ParkingZoneEntity } from './parking-zone.entity';

@Entity('parking_floors')
@Unique(['site_id', 'floor_code'])
export class ParkingFloorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, (site) => site.floors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'varchar', length: 30 })
  floor_code: string;

  @Column({ type: 'varchar', length: 100 })
  floor_name: string;

  @Column({ type: 'int', default: 0 })
  level_order: number;

  @Column({ type: 'numeric', precision: 3, scale: 2, nullable: true })
  max_height_meters: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  blueprint_map_url: string;

  @OneToMany(() => ParkingZoneEntity, (zone) => zone.floor, { cascade: true })
  zones: ParkingZoneEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
