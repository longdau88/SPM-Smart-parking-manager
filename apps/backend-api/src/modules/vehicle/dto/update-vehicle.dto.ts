import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateVehicleDto } from './create-vehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @IsEnum(['ACTIVE', 'BLOCKED', 'STOLEN_ALERT'])
  @IsOptional()
  vehicle_status?: 'ACTIVE' | 'BLOCKED' | 'STOLEN_ALERT';
}
