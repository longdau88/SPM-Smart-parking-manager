import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { SiteType } from '@spm/shared-types';

export class CreateParkingSiteDto {
  @ApiProperty({ example: 'PK_LANDMARK_81', description: 'Mã bãi xe duy nhất trong doanh nghiệp' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Bãi đỗ xe Tòa nhà Landmark 81' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['MALL', 'RESIDENTIAL', 'OFFICE', 'HOSPITAL', 'AIRPORT', 'PUBLIC'], default: 'MALL' })
  @IsEnum(['MALL', 'RESIDENTIAL', 'OFFICE', 'HOSPITAL', 'AIRPORT', 'PUBLIC'])
  site_type: SiteType;

  @ApiProperty({ example: '720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 10.795, required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 106.721, required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 1500, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  total_capacity?: number;

  @ApiProperty({ example: 500, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  car_capacity?: number;

  @ApiProperty({ example: 1000, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  motorcycle_capacity?: number;
}
