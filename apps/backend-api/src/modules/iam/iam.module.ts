import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UserEntity } from './entities/user.entity';
import { RoleEntity } from './entities/role.entity';
import { PermissionEntity } from './entities/permission.entity';
import { UserRoleEntity } from './entities/user-role.entity';

import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { RoleController } from './controllers/role.controller';

import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RoleEntity, PermissionEntity, UserRoleEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || 'REDACTED_JWT_ACCESS_SECRET',
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController, UserController, RoleController],
  providers: [AuthService, UserService, RoleService, JwtStrategy],
  exports: [AuthService, UserService, RoleService, JwtStrategy, TypeOrmModule],
})
export class IamModule {}
