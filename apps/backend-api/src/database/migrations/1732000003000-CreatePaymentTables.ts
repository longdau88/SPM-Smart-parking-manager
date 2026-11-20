import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTables1732000003000 implements MigrationInterface {
  name = 'CreatePaymentTables1732000003000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        session_id uuid NOT NULL REFERENCES parking_sessions(id) ON DELETE CASCADE,
        invoice_number varchar(50) NOT NULL UNIQUE,
        amount numeric(12,2) NOT NULL,
        tax_amount numeric(12,2) NOT NULL DEFAULT 0,
        discount_amount numeric(12,2) NOT NULL DEFAULT 0,
        final_amount numeric(12,2) NOT NULL,
        payment_method varchar(30) NOT NULL DEFAULT 'VIETQR',
        status varchar(30) NOT NULL DEFAULT 'PENDING',
        einvoice_synced boolean NOT NULL DEFAULT false,
        einvoice_code varchar(100),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        gateway_provider varchar(50) NOT NULL,
        transaction_reference varchar(100) NOT NULL UNIQUE,
        gateway_response jsonb,
        amount numeric(12,2) NOT NULL,
        currency varchar(10) NOT NULL DEFAULT 'VND',
        status varchar(30) NOT NULL,
        verified_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant_created
      ON invoices (tenant_id, created_at DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS payment_transactions');
    await queryRunner.query('DROP TABLE IF EXISTS invoices');
  }
}
