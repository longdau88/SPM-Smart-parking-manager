import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateEntrySessionDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  display_plate: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  entry_time?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entry_image_url: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  entry_plate_crop_url: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  recognition_id?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  is_offline_event?: boolean;
}
