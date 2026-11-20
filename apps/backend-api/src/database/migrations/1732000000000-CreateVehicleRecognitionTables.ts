import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVehicleRecognitionTables1732000000000 implements MigrationInterface {
  name = 'CreateVehicleRecognitionTables1732000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        owner_user_id uuid,
        clean_plate varchar(30) NOT NULL,
        display_plate varchar(30) NOT NULL,
        vehicle_type varchar(30) NOT NULL,
        brand varchar(100),
        model varchar(100),
        color varchar(50),
        vehicle_status varchar(30) NOT NULL DEFAULT 'ACTIVE',
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_vehicles_tenant_clean_plate UNIQUE (tenant_id, clean_plate)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status
      ON vehicles (tenant_id, vehicle_status)
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recognition_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        lane_id uuid NOT NULL REFERENCES parking_lanes(id) ON DELETE CASCADE,
        direction varchar(10) NOT NULL,
        recognized_clean_plate varchar(30) NOT NULL,
        recognized_display_plate varchar(30),
        confidence_score double precision NOT NULL,
        detected_vehicle_type varchar(50),
        raw_image_url text NOT NULL,
        cropped_plate_url text NOT NULL,
        inference_time_ms integer NOT NULL,
        ai_model_version varchar(100) NOT NULL,
        is_manually_corrected boolean NOT NULL DEFAULT false,
        corrected_plate varchar(30),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_recognition_logs_site_created
      ON recognition_logs (site_id, created_at DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_recognition_logs_tenant_plate
      ON recognition_logs (tenant_id, recognized_clean_plate)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS recognition_logs');
    await queryRunner.query('DROP TABLE IF EXISTS vehicles');
  }
}
