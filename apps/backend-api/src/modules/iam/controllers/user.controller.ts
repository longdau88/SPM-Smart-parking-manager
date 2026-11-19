import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Tạo tài khoản người dùng mới (Nhân viên, Quản trị viên)' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentTenant() tenantId?: string,
    @CurrentUser('user_type') userType?: string,
  ) {
    // If not SUPER_ADMIN, force tenant to the creator's tenant
    const targetTenantId = userType === 'SUPER_ADMIN' ? tenantId : tenantId;
    const data = await this.userService.createUser(dto, targetTenantId);
    return {
      message: 'Tạo tài khoản thành công',
      data,
    };
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Lấy danh sách người dùng theo phân trang & Tenant' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async findAll(
    @CurrentTenant() tenantId?: string,
    @CurrentUser('user_type') userType?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    const filterTenant = userType === 'SUPER_ADMIN' ? undefined : tenantId;
    const result = await this.userService.findAll(filterTenant, page, limit);
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết tài khoản người dùng' })
  async findOne(@Param('id') id: string) {
    const data = await this.userService.findById(id);
    return {
      message: 'Lấy chi tiết thành công',
      data,
    };
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Kích hoạt hoặc khóa tài khoản' })
  async updateStatus(@Param('id') id: string, @Body('is_active') isActive: boolean) {
    const data = await this.userService.updateStatus(id, isActive);
    return {
      message: isActive ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản',
      data,
    };
  }
}
