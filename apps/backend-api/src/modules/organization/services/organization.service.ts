import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly orgRepository: Repository<OrganizationEntity>,
  ) {}

  async create(dto: CreateOrganizationDto) {
    const existing = await this.orgRepository.findOne({
      where: { code: dto.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Mã doanh nghiệp '${dto.code}' đã tồn tại`);
    }

    const org = this.orgRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
      subscription_status: 'ACTIVE',
    });

    return this.orgRepository.save(org);
  }

  async findAll(page = 1, limit = 20) {
    const [items, total] = await this.orgRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data: items,
      meta: {
        page,
        limit,
        total_records: total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Không tìm thấy doanh nghiệp');
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.findById(id);

    if (dto.code && dto.code.toUpperCase() !== org.code) {
      const existing = await this.orgRepository.findOne({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing) {
        throw new ConflictException(`Mã doanh nghiệp '${dto.code}' đã tồn tại`);
      }
      org.code = dto.code.toUpperCase();
    }

    Object.assign(org, dto);
    return this.orgRepository.save(org);
  }
}
