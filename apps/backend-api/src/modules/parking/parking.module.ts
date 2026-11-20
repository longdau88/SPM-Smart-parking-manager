import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ParkingSiteEntity } from './entities/parking-site.entity';
import { ParkingFloorEntity } from './entities/parking-floor.entity';
import { ParkingZoneEntity } from './entities/parking-zone.entity';
import { ParkingSlotEntity } from './entities/parking-slot.entity';
import { ParkingLaneEntity } from './entities/parking-lane.entity';

import { ParkingSiteController } from './controllers/parking-site.controller';
import { ParkingLayoutController } from './controllers/parking-layout.controller';
import { ParkingLaneController } from './controllers/parking-lane.controller';

import { ParkingSiteService } from './services/parking-site.service';
import { ParkingLayoutService } from './services/parking-layout.service';
import { ParkingLaneService } from './services/parking-lane.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParkingSiteEntity,
      ParkingFloorEntity,
      ParkingZoneEntity,
      ParkingSlotEntity,
      ParkingLaneEntity,
    ]),
  ],
  controllers: [
    ParkingSiteController,
    ParkingLayoutController,
    ParkingLaneController,
  ],
  providers: [
    ParkingSiteService,
    ParkingLayoutService,
    ParkingLaneService,
  ],
  exports: [
    ParkingSiteService,
    ParkingLayoutService,
    ParkingLaneService,
    TypeOrmModule,
  ],
})
export class ParkingModule {}
