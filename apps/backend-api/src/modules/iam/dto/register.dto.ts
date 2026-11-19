import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer@spm.io' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'Pass123456@' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'uuid-tenant-vincom', required: false })
  @IsOptional()
  @IsString()
  tenant_id?: string;
}
