import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserEntity } from '../entities/user.entity';

describe('AuthService (Sprint 01 Unit Tests)', () => {
  let authService: AuthService;
  let mockUserRepository: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('nên khởi tạo thành công AuthService', () => {
    expect(authService).toBeDefined();
  });

  it('nên từ chối đăng nhập khi không tìm thấy tài khoản', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'nonexistent@spm.io', password: 'password123' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('nên từ chối đăng nhập khi mật khẩu sai', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass@2026', 10);
    mockUserRepository.findOne.mockResolvedValue({
      id: 'uuid-1',
      email: 'admin@spm.io',
      password_hash: passwordHash,
      is_active: true,
      user_roles: [],
    });

    await expect(
      authService.login({ username: 'admin@spm.io', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('nên đăng nhập thành công và trả về Access Token khi thông tin hợp lệ', async () => {
    const rawPassword = 'CorrectPass@2026';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    mockUserRepository.findOne.mockResolvedValue({
      id: 'uuid-super-admin',
      email: 'admin@spm.io',
      phone_number: '0900000001',
      full_name: 'SPM Super Administrator',
      password_hash: passwordHash,
      user_type: 'SUPER_ADMIN',
      tenant_id: null,
      is_active: true,
      user_roles: [
        {
          role: {
            code: 'SUPER_ADMIN',
            name: 'Quản trị viên Nền tảng',
            permissions: [{ code: 'dashboard.read' }],
          },
        },
      ],
    });

    const result = await authService.login({
      username: 'admin@spm.io',
      password: rawPassword,
    });

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
    expect(result.user.email).toBe('admin@spm.io');
    expect(result.user.roles).toContain('SUPER_ADMIN');
    expect(result.user.permissions).toContain('dashboard.read');
  });
});
