import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ExitCheckDto {
  @ApiProperty()
  @IsUUID()
  site_id: string;

  @ApiProperty()
  @IsUUID()
  lane_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clean_plate: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  display_plate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  exit_time?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exit_image_url: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  exit_plate_crop_url?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  recognition_id?: string;
}
