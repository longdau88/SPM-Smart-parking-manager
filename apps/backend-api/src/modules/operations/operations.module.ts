import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { AuditLogEntity } from './entities/audit-log.entity';
import { BarrierService } from './barrier.service';
import { OperationsController } from './operations.controller';
import { RealtimeGateway } from './realtime.gateway';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([ParkingLaneEntity, ParkingSiteEntity, AuditLogEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'REDACTED_JWT_ACCESS_SECRET',
      }),
    }),
  ],
  controllers: [OperationsController],
  providers: [BarrierService, RealtimeGateway],
  exports: [BarrierService, RealtimeGateway],
})
export class OperationsModule {}
