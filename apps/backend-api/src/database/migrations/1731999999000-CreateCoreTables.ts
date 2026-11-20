import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1731999999000 implements MigrationInterface {
  name = 'CreateCoreTables1731999999000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(50) NOT NULL UNIQUE,
        name varchar(255) NOT NULL,
        tax_code varchar(50),
        contact_email varchar(255) NOT NULL,
        contact_phone varchar(20) NOT NULL,
        address text,
        subscription_status varchar(30) NOT NULL DEFAULT 'ACTIVE',
        max_sites integer NOT NULL DEFAULT 1,
        max_lanes integer NOT NULL DEFAULT 4,
        max_cameras integer NOT NULL DEFAULT 8,
        settings jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        module varchar(50) NOT NULL,
        action varchar(50) NOT NULL,
        code varchar(100) NOT NULL UNIQUE,
        description text
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid,
        code varchar(50) NOT NULL,
        name varchar(100) NOT NULL,
        description text,
        is_system boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        email varchar(255) UNIQUE,
        phone_number varchar(20) UNIQUE,
        password_hash varchar(255) NOT NULL,
        full_name varchar(150) NOT NULL,
        avatar_url varchar(500),
        user_type varchar(30) NOT NULL DEFAULT 'CUSTOMER',
        is_active boolean NOT NULL DEFAULT true,
        is_mfa_enabled boolean NOT NULL DEFAULT false,
        mfa_secret varchar(100),
        last_login_at timestamptz,
        last_login_ip inet,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at timestamptz
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        site_id uuid,
        PRIMARY KEY (user_id, role_id)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_sites (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code varchar(50) NOT NULL,
        name varchar(255) NOT NULL,
        site_type varchar(50) NOT NULL DEFAULT 'MALL',
        address text NOT NULL,
        latitude double precision,
        longitude double precision,
        total_capacity integer NOT NULL DEFAULT 0,
        car_capacity integer NOT NULL DEFAULT 0,
        motorcycle_capacity integer NOT NULL DEFAULT 0,
        operating_hours jsonb NOT NULL DEFAULT '{"open":"00:00","close":"23:59","is_24_7":true}'::jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at timestamptz,
        UNIQUE (tenant_id, code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_floors (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        floor_code varchar(30) NOT NULL,
        floor_name varchar(100) NOT NULL,
        level_order integer NOT NULL DEFAULT 0,
        max_height_meters numeric(3,2),
        blueprint_map_url varchar(500),
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (site_id, floor_code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_zones (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        floor_id uuid NOT NULL REFERENCES parking_floors(id) ON DELETE CASCADE,
        zone_code varchar(30) NOT NULL,
        zone_name varchar(100) NOT NULL,
        allowed_vehicle_type varchar(30) NOT NULL DEFAULT 'CAR',
        capacity integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (floor_id, zone_code)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        zone_id uuid NOT NULL REFERENCES parking_zones(id) ON DELETE CASCADE,
        slot_number varchar(30) NOT NULL,
        slot_type varchar(30) NOT NULL DEFAULT 'STANDARD',
        occupancy_status varchar(30) NOT NULL DEFAULT 'EMPTY',
        sensor_device_id uuid,
        current_vehicle_id uuid,
        coordinates jsonb,
        last_status_changed_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (zone_id, slot_number)
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS parking_lanes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id uuid NOT NULL REFERENCES parking_sites(id) ON DELETE CASCADE,
        edge_node_id uuid,
        lane_code varchar(30) NOT NULL,
        lane_name varchar(100) NOT NULL,
        lane_type varchar(30) NOT NULL DEFAULT 'ENTRY',
        operating_mode varchar(30) NOT NULL DEFAULT 'AUTO_AI',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (site_id, lane_code)
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS parking_lanes');
    await queryRunner.query('DROP TABLE IF EXISTS parking_slots');
    await queryRunner.query('DROP TABLE IF EXISTS parking_zones');
    await queryRunner.query('DROP TABLE IF EXISTS parking_floors');
    await queryRunner.query('DROP TABLE IF EXISTS parking_sites');
    await queryRunner.query('DROP TABLE IF EXISTS user_roles');
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TABLE IF EXISTS role_permissions');
    await queryRunner.query('DROP TABLE IF EXISTS roles');
    await queryRunner.query('DROP TABLE IF EXISTS permissions');
    await queryRunner.query('DROP TABLE IF EXISTS organizations');
  }
}
