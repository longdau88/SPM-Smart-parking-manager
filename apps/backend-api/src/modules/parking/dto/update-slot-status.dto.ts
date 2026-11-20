import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateSlotStatusDto {
  @ApiProperty({ enum: ['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'] })
  @IsEnum(['EMPTY', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'])
  @IsNotEmpty()
  occupancy_status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

  @ApiProperty({ example: 'uuid-vehicle-vf8', required: false })
  @IsString()
  @IsOptional()
  vehicle_id?: string;
}
