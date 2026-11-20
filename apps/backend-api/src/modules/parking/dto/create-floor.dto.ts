import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({ example: 'B1', description: 'Mã tầng hầm/tầng nổi' })
  @IsString()
  @IsNotEmpty()
  floor_code: string;

  @ApiProperty({ example: 'Tầng Hầm B1 - Khu để xe vãng lai & cư dân' })
  @IsString()
  @IsNotEmpty()
  floor_name: string;

  @ApiProperty({ example: -1, default: 0 })
  @IsInt()
  @IsOptional()
  level_order?: number;

  @ApiProperty({ example: 2.2, required: false, description: 'Giới hạn chiều cao xe (m)' })
  @IsNumber()
  @IsOptional()
  max_height_meters?: number;

  @ApiProperty({ example: 'https://storage.spm.io/maps/b1-layout.svg', required: false })
  @IsString()
  @IsOptional()
  blueprint_map_url?: string;
}
