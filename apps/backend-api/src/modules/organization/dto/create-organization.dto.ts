import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'VINCOM_RETAIL', description: 'Mã định danh doanh nghiệp duy nhất' })
  @IsString()
  @IsNotEmpty({ message: 'Mã doanh nghiệp không được để trống' })
  code: string;

  @ApiProperty({ example: 'Công ty Cổ phần Vincom Retail' })
  @IsString()
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  name: string;

  @ApiProperty({ example: '0105850244', required: false })
  @IsString()
  @IsOptional()
  tax_code?: string;

  @ApiProperty({ example: 'contact@vincom.com.vn' })
  @IsEmail({}, { message: 'Email liên hệ không hợp lệ' })
  @IsNotEmpty()
  contact_email: string;

  @ApiProperty({ example: '19006017' })
  @IsString()
  @IsNotEmpty()
  contact_phone: string;

  @ApiProperty({ example: 'Số 7, Đường Bằng Lăng 1, KĐT Vinhomes Riverside, Long Biên, Hà Nội', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 5, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_sites?: number;

  @ApiProperty({ example: 20, default: 4 })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_lanes?: number;

  @ApiProperty({ example: 40, default: 8 })
  @IsInt()
  @Min(1)
  @IsOptional()
  max_cameras?: number;
}
