import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email?: string;
  phone_number?: string;
  user_type: string;
  tenant_id?: string | null;
  site_id?: string | null;
  roles: string[];
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_active: true },
      relations: ['user_roles', 'user_roles.role', 'user_roles.role.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // Extract current roles and all distinct permissions
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
      user_type: user.user_type,
      tenant_id: user.tenant_id,
      roles,
      permissions: Array.from(permissionsSet),
    };
  }
}
