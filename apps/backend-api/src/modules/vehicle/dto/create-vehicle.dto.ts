import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { VehicleType } from '@spm/shared-types';

export class CreateVehicleDto {
  @ApiProperty({ example: '51h-987.65' })
  @IsString()
  @IsNotEmpty()
  clean_plate: string;

  @ApiProperty({ example: '51H-987.65', required: false })
  @IsString()
  @IsOptional()
  display_plate?: string;

  @ApiProperty({ enum: ['MOTORCYCLE', 'CAR_SEDAN', 'CAR_SUV', 'TRUCK', 'BUS', 'EV_CAR', 'BICYCLE'] })
  @IsEnum(['MOTORCYCLE', 'CAR_SEDAN', 'CAR_SUV', 'TRUCK', 'BUS', 'EV_CAR', 'BICYCLE'])
  vehicle_type: VehicleType;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  owner_user_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  color?: string;
}
