import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEdgeIngestionTables1732000005000 implements MigrationInterface {
  name = 'CreateEdgeIngestionTables1732000005000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recognition_logs" ADD COLUMN IF NOT EXISTS "edge_event_id" uuid`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_recognition_logs_edge_event_id" ON "recognition_logs" ("edge_event_id") WHERE "edge_event_id" IS NOT NULL`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "edge_event_receipts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "edge_event_id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "lane_id" uuid,
        "event_type" varchar(100) NOT NULL,
        "status" varchar(30) NOT NULL DEFAULT 'ACCEPTED',
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UQ_edge_event_receipts_edge_event_id" UNIQUE ("edge_event_id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "edge_device_heartbeats" (
        "device_id" uuid PRIMARY KEY,
        "tenant_id" uuid NOT NULL,
        "site_id" uuid NOT NULL,
        "lane_id" uuid,
        "state" varchar(30) NOT NULL,
        "last_seen_at" timestamptz NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "edge_device_heartbeats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "edge_event_receipts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_recognition_logs_edge_event_id"`);
    await queryRunner.query(`ALTER TABLE "recognition_logs" DROP COLUMN IF EXISTS "edge_event_id"`);
  }
}
