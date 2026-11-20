import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateEntrySessionDto } from '../dto/create-entry-session.dto';
import { ExitCheckDto } from '../dto/exit-check.dto';
import { ParkingSessionService } from '../services/parking-session.service';

@ApiTags('Parking Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parking-sessions')
export class ParkingSessionController {
  constructor(private readonly sessionService: ParkingSessionService) {}

  @Post('entry')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Tạo phiên gửi xe khi phương tiện vào bãi' })
  async entry(@Body() dto: CreateEntrySessionDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Phiên gửi xe đã được khởi tạo thành công', data: await this.sessionService.createEntry(dto, tenantId) };
  }

  @Post('exit-check')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Khớp phiên xe ra và tính thời lượng đỗ' })
  async exit(@Body() dto: ExitCheckDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Đã khớp phiên gửi xe thành công', data: await this.sessionService.exitCheck(dto, tenantId) };
  }

  @Get('sites/:siteId/active')
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async active(
    @Param('siteId') siteId: string,
    @CurrentTenant() tenantId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    const result = await this.sessionService.findActive(siteId, tenantId, page, limit);
    return { message: 'Lấy danh sách phiên đang hoạt động thành công', ...result };
  }
}
