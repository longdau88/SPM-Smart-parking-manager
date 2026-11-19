import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TenantContextService } from './tenant-context.service';
import { UserEntity } from '../../modules/iam/entities/user.entity';
import { RoleEntity } from '../../modules/iam/entities/role.entity';
import { PermissionEntity } from '../../modules/iam/entities/permission.entity';
import { UserRoleEntity } from '../../modules/iam/entities/user-role.entity';
import { OrganizationEntity } from '../../modules/organization/entities/organization.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'spm_admin'),
        password: config.get<string>('DB_PASSWORD', 'REDACTED_DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'spm_enterprise'),
        schema: config.get<string>('DB_SCHEMA', 'public'),
        entities: [
          UserEntity,
          RoleEntity,
          PermissionEntity,
          UserRoleEntity,
          OrganizationEntity,
        ],
        synchronize: true, // Auto-create tables in dev, set to false in prod with migrations
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
  ],
  providers: [TenantContextService],
  exports: [TenantContextService, TypeOrmModule],
})
export class DatabaseModule {}
