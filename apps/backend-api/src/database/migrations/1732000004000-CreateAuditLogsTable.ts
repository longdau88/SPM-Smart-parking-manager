import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogsTable1732000004000 implements MigrationInterface {
  name = 'CreateAuditLogsTable1732000004000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "site_id" uuid,
        "lane_id" uuid,
        "operator_id" uuid,
        "action" varchar(100) NOT NULL,
        "outcome" varchar(20) NOT NULL,
        "reason" text,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_tenant" ON "audit_logs" ("tenant_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_site" ON "audit_logs" ("site_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_logs_lane" ON "audit_logs" ("lane_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
  }
}
