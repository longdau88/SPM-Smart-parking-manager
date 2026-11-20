import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingLaneEntity } from '../parking/entities/parking-lane.entity';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { RecognitionEventController } from './controllers/recognition-event.controller';
import { VehicleController } from './controllers/vehicle.controller';
import { RecognitionEventEntity } from './entities/recognition-event.entity';
import { VehicleEntity } from './entities/vehicle.entity';
import { RecognitionEventService } from './services/recognition-event.service';
import { VehicleService } from './services/vehicle.service';

@Module({
  imports: [TypeOrmModule.forFeature([VehicleEntity, RecognitionEventEntity, ParkingLaneEntity, ParkingSiteEntity])],
  controllers: [VehicleController, RecognitionEventController],
  providers: [VehicleService, RecognitionEventService],
  exports: [VehicleService, RecognitionEventService, TypeOrmModule],
})
export class VehicleModule {}
