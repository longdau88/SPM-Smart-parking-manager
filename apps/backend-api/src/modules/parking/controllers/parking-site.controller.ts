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
import { ParkingSiteService } from '../services/parking-site.service';
import { CreateParkingSiteDto } from '../dto/create-parking-site.dto';
import { UpdateParkingSiteDto } from '../dto/update-parking-site.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Parking Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking-sites')
export class ParkingSiteController {
  constructor(private readonly siteService: ParkingSiteService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Tạo mới cơ sở bãi đỗ xe' })
  async create(
    @Body() dto: CreateParkingSiteDto,
    @CurrentTenant() tenantId?: string,
  ) {
    const data = await this.siteService.create(dto, tenantId!);
    return {
      message: 'Tạo bãi xe thành công',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các bãi đỗ xe' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @CurrentTenant() tenantId?: string,
    @CurrentUser('user_type') userType?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const filterTenant = userType === 'SUPER_ADMIN' ? undefined : tenantId;
    const result = await this.siteService.findAll(filterTenant, page, limit);
    return {
      message: 'Lấy danh sách bãi xe thành công',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin bãi đỗ xe' })
  async findOne(@Param('id') id: string) {
    const data = await this.siteService.findById(id);
    return {
      message: 'Lấy chi tiết bãi xe thành công',
      data,
    };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Cập nhật cấu hình bãi đỗ xe' })
  async update(@Param('id') id: string, @Body() dto: UpdateParkingSiteDto) {
    const data = await this.siteService.update(id, dto);
    return {
      message: 'Cập nhật bãi xe thành công',
      data,
    };
  }

  @Get(':id/occupancy')
  @ApiOperation({ summary: 'Lấy số liệu tỷ lệ lấp đầy trực tiếp (Occupancy Stats)' })
  async getOccupancy(@Param('id') id: string) {
    const data = await this.siteService.getOccupancy(id);
    return {
      message: 'Lấy thống kê chỗ đỗ thành công',
      data,
    };
  }
}
