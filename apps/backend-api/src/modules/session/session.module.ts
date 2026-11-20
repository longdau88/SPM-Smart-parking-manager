import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { RecognitionEventEntity } from '../vehicle/entities/recognition-event.entity';
import { VehicleEntity } from '../vehicle/entities/vehicle.entity';
import { ParkingSessionController } from './controllers/parking-session.controller';
import { ParkingSessionEntity } from './entities/parking-session.entity';
import { ParkingSessionService } from './services/parking-session.service';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    BillingModule,
    TypeOrmModule.forFeature([
      ParkingSessionEntity,
      ParkingSiteEntity,
      ParkingLaneEntity,
      VehicleEntity,
      RecognitionEventEntity,
    ]),
  ],
  controllers: [ParkingSessionController],
  providers: [ParkingSessionService],
  exports: [ParkingSessionService, TypeOrmModule],
})
export class SessionModule {}
