import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../entities/user.entity';
import { UserRoleEntity } from '../entities/user-role.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async createUser(dto: CreateUserDto, tenantId?: string) {
    if (dto.email) {
      const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email đã tồn tại trên hệ thống');
      }
    }

    if (dto.phone_number) {
      const existingPhone = await this.userRepository.findOne({ where: { phone_number: dto.phone_number } });
      if (existingPhone) {
        throw new ConflictException('Số điện thoại đã tồn tại trên hệ thống');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      email: dto.email,
      phone_number: dto.phone_number,
      full_name: dto.full_name,
      password_hash: passwordHash,
      user_type: dto.user_type,
      tenant_id: tenantId || null,
      is_active: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign Role
    if (dto.role_id) {
      const userRole = this.userRoleRepository.create({
        user_id: savedUser.id,
        role_id: dto.role_id,
        site_id: dto.site_id || null,
      });
      await this.userRoleRepository.save(userRole);
    }

    return this.findById(savedUser.id);
  }

  async findAll(tenantId?: string, page = 1, limit = 20) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'org')
      .leftJoinAndSelect('user.user_roles', 'ur')
      .leftJoinAndSelect('ur.role', 'role')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.created_at', 'DESC');

    if (tenantId) {
      qb.andWhere('user.tenant_id = :tenantId', { tenantId });
    }

    const [items, total] = await qb.getManyAndCount();

    const sanitizedItems = items.map((u) => ({
      id: u.id,
      email: u.email,
      phone_number: u.phone_number,
      full_name: u.full_name,
      user_type: u.user_type,
      tenant_id: u.tenant_id,
      tenant_name: u.organization?.name,
      roles: u.user_roles?.map((r) => r.role?.name).filter(Boolean),
      is_active: u.is_active,
      created_at: u.created_at,
    }));

    return {
      data: sanitizedItems,
      meta: {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['organization', 'user_roles', 'user_roles.role'],
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    return {
      id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      full_name: user.full_name,
      user_type: user.user_type,
      tenant_id: user.tenant_id,
      tenant: user.organization ? { id: user.organization.id, name: user.organization.name } : null,
      roles: user.user_roles?.map((r) => r.role?.name),
      is_active: user.is_active,
      created_at: user.created_at,
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    user.is_active = isActive;
    await this.userRepository.save(user);
    return { id: user.id, is_active: user.is_active };
  }
}
