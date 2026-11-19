import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserEntity } from '../../iam/entities/user.entity';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_code: string;

  @Column({ type: 'varchar', length: 255 })
  contact_email: string;

  @Column({ type: 'varchar', length: 20 })
  contact_phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 30, default: 'ACTIVE' })
  subscription_status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

  @Column({ type: 'int', default: 1 })
  max_sites: number;

  @Column({ type: 'int', default: 4 })
  max_lanes: number;

  @Column({ type: 'int', default: 8 })
  max_cameras: number;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @OneToMany(() => UserEntity, (user) => user.organization)
  users: UserEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;
}
