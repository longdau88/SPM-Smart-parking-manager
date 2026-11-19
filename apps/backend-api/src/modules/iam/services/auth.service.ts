import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto, clientIp?: string) {
    const { username, password } = dto;

    // Support login via email or phone_number
    const user = await this.userRepository.findOne({
      where: [{ email: username }, { phone_number: username }],
      relations: ['user_roles', 'user_roles.role', 'user_roles.role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa, vui lòng liên hệ quản trị viên');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    // Update login audit info
    user.last_login_at = new Date();
    if (clientIp) {
      user.last_login_ip = clientIp;
    }
    await this.userRepository.save(user);

    // Extract roles and permissions
    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.user_roles || []) {
      if (ur.role) {
        roles.push(ur.role.code);
        for (const p of ur.role.permissions || []) {
          permissionsSet.add(p.code);
        }
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone_number: user.phone_number,
      user_type: user.user_type,
      tenant_id: user.tenant_id,
      roles,
      permissions: Array.from(permissionsSet),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'REDACTED_JWT_REFRESH_SECRET',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900, // 15 mins in seconds
      user: {
        id: user.id,
        email: user.email,
        phone_number: user.phone_number,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        user_type: user.user_type,
        tenant_id: user.tenant_id,
        roles,
        permissions: Array.from(permissionsSet),
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone_number: dto.phone_number }],
    });

    if (existing) {
      throw new ConflictException('Email hoặc số điện thoại đã được đăng ký');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRepository.create({
      email: dto.email,
      phone_number: dto.phone_number,
      full_name: dto.full_name,
      password_hash: passwordHash,
      tenant_id: dto.tenant_id || null,
      user_type: 'CUSTOMER',
      is_active: true,
    });

    const saved = await this.userRepository.save(newUser);

    return {
      id: saved.id,
      email: saved.email,
      phone_number: saved.phone_number,
      full_name: saved.full_name,
      user_type: saved.user_type,
      created_at: saved.created_at,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'REDACTED_JWT_REFRESH_SECRET',
      });

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub, is_active: true },
        relations: ['user_roles', 'user_roles.role', 'user_roles.role.permissions'],
      });

      if (!user) {
        throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
      }

      const roles: string[] = [];
      const permissionsSet = new Set<string>();

      for (const ur of user.user_roles || []) {
        if (ur.role) {
          roles.push(ur.role.code);
          for (const p of ur.role.permissions || []) {
            permissionsSet.add(p.code);
          }
        }
      }

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        phone_number: user.phone_number,
        user_type: user.user_type,
        tenant_id: user.tenant_id,
        roles,
        permissions: Array.from(permissionsSet),
      };

      const newAccessToken = this.jwtService.sign(payload);
      return {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 900,
      };
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization', 'user_roles', 'user_roles.role', 'user_roles.role.permissions'],
    });

    if (!user) {
      throw new BadRequestException('Không tìm thấy thông tin tài khoản');
    }

    const roles: string[] = [];
    const permissionsSet = new Set<string>();

    for (const ur of user.user_roles || []) {
      if (ur.role) {
        roles.push(ur.role.code);
        for (const p of ur.role.permissions || []) {
          permissionsSet.add(p.code);
        }
      }
    }

    return {
      id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      user_type: user.user_type,
      tenant: user.organization
        ? {
            id: user.organization.id,
            code: user.organization.code,
            name: user.organization.name,
          }
        : null,
      roles,
      permissions: Array.from(permissionsSet),
      is_mfa_enabled: user.is_mfa_enabled,
      created_at: user.created_at,
    };
  }
}
