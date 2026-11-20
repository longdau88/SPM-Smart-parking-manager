import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { RlsContextMiddleware } from './common/database/rls-context.middleware';
import { IamModule } from './modules/iam/iam.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ParkingModule } from './modules/parking/parking.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { SessionModule } from './modules/session/session.module';
import { BillingModule } from './modules/billing/billing.module';
import { OperationsModule } from './modules/operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule,
    IamModule,
    OrganizationModule,
    ParkingModule,
    VehicleModule,
    SessionModule,
    BillingModule,
    OperationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RlsContextMiddleware).forRoutes('*');
  }
}
