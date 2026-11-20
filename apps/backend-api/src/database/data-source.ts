import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UserEntity } from '../modules/iam/entities/user.entity';
import { RoleEntity } from '../modules/iam/entities/role.entity';
import { PermissionEntity } from '../modules/iam/entities/permission.entity';
import { UserRoleEntity } from '../modules/iam/entities/user-role.entity';
import { OrganizationEntity } from '../modules/organization/entities/organization.entity';
import { ParkingSiteEntity } from '../modules/parking/entities/parking-site.entity';
import { ParkingFloorEntity } from '../modules/parking/entities/parking-floor.entity';
import { ParkingZoneEntity } from '../modules/parking/entities/parking-zone.entity';
import { ParkingSlotEntity } from '../modules/parking/entities/parking-slot.entity';
import { ParkingLaneEntity } from '../modules/parking/entities/parking-lane.entity';
import { VehicleEntity } from '../modules/vehicle/entities/vehicle.entity';
import { RecognitionEventEntity } from '../modules/vehicle/entities/recognition-event.entity';
import { ParkingSessionEntity } from '../modules/session/entities/parking-session.entity';
import { PricingRuleEntity } from '../modules/billing/entities/pricing-rule.entity';
import { InvoiceEntity } from '../modules/billing/entities/invoice.entity';
import { PaymentTransactionEntity } from '../modules/billing/entities/payment-transaction.entity';
import { AuditLogEntity } from '../modules/operations/entities/audit-log.entity';
import { EdgeEventReceiptEntity } from '../modules/operations/entities/edge-event-receipt.entity';
import { EdgeDeviceHeartbeatEntity } from '../modules/operations/entities/edge-device-heartbeat.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'spm_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'spm_enterprise',
  schema: process.env.DB_SCHEMA ?? 'public',
  entities: [
    UserEntity,
    RoleEntity,
    PermissionEntity,
    UserRoleEntity,
    OrganizationEntity,
    ParkingSiteEntity,
    ParkingFloorEntity,
    ParkingZoneEntity,
    ParkingSlotEntity,
    ParkingLaneEntity,
    VehicleEntity,
    RecognitionEventEntity,
    ParkingSessionEntity,
    PricingRuleEntity,
    InvoiceEntity,
    PaymentTransactionEntity,
    AuditLogEntity,
    EdgeEventReceiptEntity,
    EdgeDeviceHeartbeatEntity,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  migrationsTableName: 'spm_migrations',
  synchronize: false,
  migrationsRun: false,
  logging: process.env.DB_LOGGING === 'true',
});
