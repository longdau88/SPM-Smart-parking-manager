import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from '../services/organization.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Organizations (Tenants)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Tạo mới Doanh nghiệp đối tác (Super Admin)' })
  async create(@Body() dto: CreateOrganizationDto) {
    const data = await this.orgService.create(dto);
    return {
      message: 'Tạo doanh nghiệp thành công',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Lấy danh sách các Doanh nghiệp thuê bao' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const result = await this.orgService.findAll(page, limit);
    return {
      message: 'Lấy danh sách doanh nghiệp thành công',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Xem chi tiết thông tin Doanh nghiệp' })
  async findOne(@Param('id') id: string) {
    const data = await this.orgService.findById(id);
    return {
      message: 'Lấy thông tin thành công',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Cập nhật thông tin Doanh nghiệp' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    const data = await this.orgService.update(id, dto);
    return {
      message: 'Cập nhật thành công',
      data,
    };
  }
}
