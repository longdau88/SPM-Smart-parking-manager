import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh mục các vai trò trong hệ thống' })
  async findAll(@CurrentTenant() tenantId?: string) {
    const data = await this.roleService.findAll(tenantId);
    return {
      message: 'Lấy danh sách vai trò thành công',
      data,
    };
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Lấy toàn bộ quyền hạn phân hệ (RBAC Permission Matrix)' })
  async findPermissions() {
    const data = await this.roleService.findAllPermissions();
    return {
      message: 'Lấy danh mục quyền hạn thành công',
      data,
    };
  }
}
