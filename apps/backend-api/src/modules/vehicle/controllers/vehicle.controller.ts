import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleService } from '../services/vehicle.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Đăng ký phương tiện trong doanh nghiệp' })
  async create(@Body() dto: CreateVehicleDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Đăng ký phương tiện thành công', data: await this.vehicleService.create(dto, tenantId!) };
  }

  @Get()
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(
    @CurrentTenant() tenantId?: string,
    @Query('q') query?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const result = await this.vehicleService.findAll(tenantId, page, limit, query);
    return { message: 'Lấy danh sách phương tiện thành công', ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() tenantId?: string) {
    return { message: 'Lấy thông tin phương tiện thành công', data: await this.vehicleService.findById(id, tenantId) };
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @CurrentTenant() tenantId?: string) {
    return { message: 'Cập nhật phương tiện thành công', data: await this.vehicleService.update(id, dto, tenantId) };
  }
}
