import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantContextService } from './tenant-context.service';
import { UserEntity } from '../../modules/iam/entities/user.entity';
import { RoleEntity } from '../../modules/iam/entities/role.entity';
import { PermissionEntity } from '../../modules/iam/entities/permission.entity';
import { UserRoleEntity } from '../../modules/iam/entities/user-role.entity';
import { OrganizationEntity } from '../../modules/organization/entities/organization.entity';
import { ParkingSiteEntity } from '../../modules/parking/entities/parking-site.entity';
import { ParkingFloorEntity } from '../../modules/parking/entities/parking-floor.entity';
import { ParkingZoneEntity } from '../../modules/parking/entities/parking-zone.entity';
import { ParkingSlotEntity } from '../../modules/parking/entities/parking-slot.entity';
import { ParkingLaneEntity } from '../../modules/parking/entities/parking-lane.entity';
import { VehicleEntity } from '../../modules/vehicle/entities/vehicle.entity';
import { RecognitionEventEntity } from '../../modules/vehicle/entities/recognition-event.entity';
import { ParkingSessionEntity } from '../../modules/session/entities/parking-session.entity';
import { PricingRuleEntity } from '../../modules/billing/entities/pricing-rule.entity';
import { InvoiceEntity } from '../../modules/billing/entities/invoice.entity';
import { PaymentTransactionEntity } from '../../modules/billing/entities/payment-transaction.entity';
import { AuditLogEntity } from '../../modules/operations/entities/audit-log.entity';
import { EdgeEventReceiptEntity } from '../../modules/operations/entities/edge-event-receipt.entity';
import { EdgeDeviceHeartbeatEntity } from '../../modules/operations/entities/edge-device-heartbeat.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'spm_admin'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'spm_enterprise'),
        schema: config.get<string>('DB_SCHEMA', 'public'),
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
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        migrationsRun: config.get<string>('DB_MIGRATIONS_RUN') === 'true',
        migrations: [__dirname + '/../../database/migrations/*.{ts,js}'],
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
  ],
  providers: [TenantContextService],
  exports: [TenantContextService, TypeOrmModule],
})
export class DatabaseModule {}
