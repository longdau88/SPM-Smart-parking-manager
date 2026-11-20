import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CalculateFeeDto {
  @ApiProperty()
  @IsUUID()
  site_id: string;

  @ApiProperty({ enum: ['CAR', 'MOTORCYCLE', 'TRUCK', 'EV_CAR'] })
  @IsEnum(['CAR', 'MOTORCYCLE', 'TRUCK', 'EV_CAR'])
  vehicle_type: 'CAR' | 'MOTORCYCLE' | 'TRUCK' | 'EV_CAR';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clean_plate: string;

  @ApiProperty()
  @IsDateString()
  entry_time: string;

  @ApiProperty()
  @IsDateString()
  exit_time: string;
}
