import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParkingSessionsTable1732000001000 implements MigrationInterface {
  name = 'CreateParkingSessionsTable1732000001000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
        clean_plate_entry varchar(32) NOT NULL,
        display_plate_entry varchar(32) NOT NULL,
        entry_time timestamptz NOT NULL,
        entry_lane_id uuid NOT NULL REFERENCES parking_lanes(id) ON DELETE RESTRICT,
        entry_image_url varchar(500) NOT NULL,
        entry_plate_crop_url varchar(500) NOT NULL,
        entry_recognition_id uuid REFERENCES recognition_logs(id) ON DELETE SET NULL,
        clean_plate_exit varchar(32),
        display_plate_exit varchar(32),
        exit_time timestamptz,
        exit_lane_id uuid REFERENCES parking_lanes(id) ON DELETE RESTRICT,
        exit_image_url varchar(500),
        exit_plate_crop_url varchar(500),
        exit_recognition_id uuid REFERENCES recognition_logs(id) ON DELETE SET NULL,
        duration_minutes integer,
        status varchar(30) NOT NULL DEFAULT 'ACTIVE',
        calculated_fee numeric(12,2) NOT NULL DEFAULT 0,
        paid_fee numeric(12,2) NOT NULL DEFAULT 0,
        payment_status varchar(30) NOT NULL DEFAULT 'UNPAID',
        is_offline_created boolean NOT NULL DEFAULT false,
        edge_sync_status varchar(20) NOT NULL DEFAULT 'SYNCED',
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_parking_sessions_active_plate
      ON parking_sessions (tenant_id, site_id, clean_plate_entry, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_parking_sessions_site_entry_time
      ON parking_sessions (site_id, entry_time DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS parking_sessions');
  }
}
