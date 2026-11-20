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
import { EdgeIngestionService } from './edge-ingestion.service';
import { EdgeEventReceiptEntity } from './entities/edge-event-receipt.entity';
import { EdgeDeviceHeartbeatEntity } from './entities/edge-device-heartbeat.entity';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SessionModule } from '../session/session.module';

@Global()
@Module({
  imports: [
    VehicleModule,
    SessionModule,
    TypeOrmModule.forFeature([ParkingLaneEntity, ParkingSiteEntity, AuditLogEntity, EdgeEventReceiptEntity, EdgeDeviceHeartbeatEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret) throw new Error('JWT_ACCESS_SECRET is required');
        return { secret };
      },
    }),
  ],
  controllers: [OperationsController],
  providers: [BarrierService, RealtimeGateway, EdgeIngestionService],
  exports: [BarrierService, RealtimeGateway, EdgeIngestionService],
})
export class OperationsModule {}
