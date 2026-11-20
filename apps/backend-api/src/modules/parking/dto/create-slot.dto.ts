import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSlotDto {
  @ApiProperty({ example: 'B1-A01', description: 'Mã ô đỗ xe duy nhất trong khu vực' })
  @IsString()
  @IsNotEmpty()
  slot_number: string;

  @ApiProperty({ enum: ['STANDARD', 'VIP', 'HANDICAPPED', 'EV_CHARGING'], default: 'STANDARD' })
  @IsEnum(['STANDARD', 'VIP', 'HANDICAPPED', 'EV_CHARGING'])
  slot_type: 'STANDARD' | 'VIP' | 'HANDICAPPED' | 'EV_CHARGING';

  @ApiProperty({ example: 'uuid-sensor-ultrasonic', required: false })
  @IsString()
  @IsOptional()
  sensor_device_id?: string;

  @ApiProperty({ example: { x: 120, y: 340 }, required: false })
  @IsOptional()
  coordinates?: { x: number; y: number; polygon?: number[][] };
}
