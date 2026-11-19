import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserType } from '@spm/shared-types';

export class CreateUserDto {
  @ApiProperty({ example: 'staff.landmark81@spm.io' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsOptional()
  phone_number?: string;

  @ApiProperty({ example: 'Trần Văn Bảo Vệ' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'TemporaryPass123@' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF', 'CASHIER', 'CUSTOMER'] })
  @IsEnum(['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF', 'CASHIER', 'CUSTOMER'])
  user_type: UserType;

  @ApiProperty({ example: 'uuid-role-staff' })
  @IsString()
  @IsNotEmpty()
  role_id: string;

  @ApiProperty({ example: 'uuid-site-landmark81', required: false })
  @IsOptional()
  @IsString()
  site_id?: string;
}
