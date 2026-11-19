import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../entities/role.entity';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
  ) {}

  async findAll(tenantId?: string) {
    const qb = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('role.is_system = :isSystem', { isSystem: true });

    if (tenantId) {
      qb.orWhere('role.tenant_id = :tenantId', { tenantId });
    }

    return qb.getMany();
  }

  async findAllPermissions() {
    return this.permissionRepository.find({
      order: { module: 'ASC', code: 'ASC' },
    });
  }
}
