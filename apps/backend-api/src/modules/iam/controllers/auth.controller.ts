import { Controller, Post, Body, Get, Ip, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống (Email / SĐT + Mật khẩu)' })
  @SwaggerResponse({ status: 200, description: 'Đăng nhập thành công, trả về Access Token và Refresh Token' })
  async login(@Body() dto: LoginDto, @Ip() ip: string) {
    const data = await this.authService.login(dto, ip);
    return {
      message: 'Đăng nhập thành công',
      data,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng mới' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return {
      message: 'Đăng ký tài khoản thành công',
      data,
    };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token bằng Refresh Token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const data = await this.authService.refreshToken(dto.refresh_token);
    return {
      message: 'Cấp mới token thành công',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  async getProfile(@CurrentUser('id') userId: string) {
    const data = await this.authService.getProfile(userId);
    return {
      message: 'Lấy thông tin thành công',
      data,
    };
  }
}
