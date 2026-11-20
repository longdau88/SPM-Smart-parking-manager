import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateRecognitionEventDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  edge_event_id?: string;
  @ApiProperty()
  @IsUUID()
  site_id: string;

  @ApiProperty()
  @IsUUID()
  lane_id: string;

  @ApiProperty({ enum: ['IN', 'OUT'] })
  @IsEnum(['IN', 'OUT'])
  direction: 'IN' | 'OUT';

  @ApiProperty({ example: '51H98765' })
  @IsString()
  @IsNotEmpty()
  clean_plate: string;

  @ApiProperty({ example: '51H-987.65', required: false })
  @IsString()
  @IsOptional()
  display_plate?: string;

  @ApiProperty({ example: 98.4 })
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence_score: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  detected_vehicle_type?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  raw_image_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cropped_plate_url: string;

  @ApiProperty({ example: 55 })
  @IsNumber()
  @Min(0)
  inference_time_ms: number;

  @ApiProperty({ example: 'YOLOv8-ANPR-VN-v2.4' })
  @IsString()
  @IsNotEmpty()
  ai_model_version: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  is_manually_corrected?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  corrected_plate?: string;
}
