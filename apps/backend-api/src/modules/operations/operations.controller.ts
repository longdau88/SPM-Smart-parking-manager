import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { BarrierControlDto } from './dto/barrier-control.dto';
import { BarrierService } from './barrier.service';

@ApiTags('Barrier & Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operations')
export class OperationsController {
  constructor(private readonly barrierService: BarrierService) {}

  @Post('barriers/:laneId/control')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  async controlBarrier(@Param('laneId') laneId: string, @Body() dto: BarrierControlDto, @CurrentTenant() tenantId?: string, @Req() request?: Request & { user?: { id?: string } }) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Lệnh điều khiển barrier đã được ghi nhận', data: await this.barrierService.control(laneId, dto, tenantId, request?.user?.id) };
  }

  @Get('audit-logs')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  async auditLogs(
    @CurrentTenant() tenantId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Lấy nhật ký audit thành công', ...await this.barrierService.findAudit(tenantId, page, limit) };
  }
}
