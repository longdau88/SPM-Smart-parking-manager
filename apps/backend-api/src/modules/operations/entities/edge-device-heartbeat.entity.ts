import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('edge_device_heartbeats')
export class EdgeDeviceHeartbeatEntity {
  @PrimaryColumn({ type: 'uuid' })
  device_id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @Column({ type: 'uuid', nullable: true })
  lane_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  state: 'ONLINE' | 'OFFLINE';

  @Column({ type: 'timestamptz' })
  last_seen_at: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
