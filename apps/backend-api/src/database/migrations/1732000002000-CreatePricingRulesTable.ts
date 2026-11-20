import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePricingRulesTable1732000002000 implements MigrationInterface {
  name = 'CreatePricingRulesTable1732000002000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        rule_name varchar(100) NOT NULL,
        vehicle_type varchar(30) NOT NULL,
        tariff_model varchar(30) NOT NULL,
        grace_period_minutes integer NOT NULL DEFAULT 15,
        rates_definition jsonb NOT NULL,
        priority integer NOT NULL DEFAULT 1,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_pricing_rules_site_name UNIQUE (tenant_id, site_id, rule_name)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricing_rules_lookup
      ON pricing_rules (tenant_id, site_id, vehicle_type, is_active, priority)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS pricing_rules');
  }
}
