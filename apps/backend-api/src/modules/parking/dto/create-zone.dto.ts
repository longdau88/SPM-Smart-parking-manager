import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ example: 'ZONE_A', description: 'Mã khu vực trong tầng' })
  @IsString()
  @IsNotEmpty()
  zone_code: string;

  @ApiProperty({ example: 'Khu A - Ô tô con & Xe điện' })
  @IsString()
  @IsNotEmpty()
  zone_name: string;

  @ApiProperty({ enum: ['CAR', 'MOTORBIKE', 'TRUCK', 'EV_CAR'], default: 'CAR' })
  @IsEnum(['CAR', 'MOTORBIKE', 'TRUCK', 'EV_CAR'])
  allowed_vehicle_type: 'CAR' | 'MOTORBIKE' | 'TRUCK' | 'EV_CAR';

  @ApiProperty({ example: 80, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;
}
