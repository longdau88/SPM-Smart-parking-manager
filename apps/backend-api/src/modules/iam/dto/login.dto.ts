import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@spm.io', description: 'Email hoặc Số điện thoại đăng nhập' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'REDACTED_INITIAL_ADMIN_PASSWORD', description: 'Mật khẩu tài khoản' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  @IsString()
  password: string;
}
