import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LaneType, LaneOperatingMode } from '@spm/shared-types';

export class CreateLaneDto {
  @ApiProperty({ example: 'L01_IN', description: 'Mã làn xe duy nhất trong bãi' })
  @IsString()
  @IsNotEmpty()
  lane_code: string;

  @ApiProperty({ example: 'Làn Vào 01 - Cổng Chính' })
  @IsString()
  @IsNotEmpty()
  lane_name: string;

  @ApiProperty({ enum: ['ENTRY', 'EXIT', 'BIDIRECTIONAL'], default: 'ENTRY' })
  @IsEnum(['ENTRY', 'EXIT', 'BIDIRECTIONAL'])
  lane_type: LaneType;

  @ApiProperty({ enum: ['AUTO_AI', 'MANUAL_STAFF', 'EMERGENCY_OPEN', 'CLOSED'], default: 'AUTO_AI' })
  @IsEnum(['AUTO_AI', 'MANUAL_STAFF', 'EMERGENCY_OPEN', 'CLOSED'])
  @IsOptional()
  operating_mode?: LaneOperatingMode;

  @ApiProperty({ example: 'uuid-edge-node-01', required: false })
  @IsString()
  @IsOptional()
  edge_node_id?: string;
}
