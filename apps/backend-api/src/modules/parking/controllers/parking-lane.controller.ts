import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ParkingLaneService } from '../services/parking-lane.service';
import { CreateLaneDto } from '../dto/create-lane.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { LaneOperatingMode } from '@spm/shared-types';

@ApiTags('Parking Lanes & Gate Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ParkingLaneController {
  constructor(private readonly laneService: ParkingLaneService) {}

  @Get('parking-lanes')
  @ApiOperation({ summary: 'Lấy danh sách các làn xe của bãi' })
  @ApiQuery({ name: 'site_id', required: true })
  async findBySite(@Query('site_id') siteId: string) {
    const data = await this.laneService.findBySite(siteId);
    return {
      message: 'Lấy danh sách làn xe thành công',
      data,
    };
  }

  @Post('parking-sites/:siteId/lanes')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Tạo mới làn kiểm soát vào/ra' })
  async createLane(@Param('siteId') siteId: string, @Body() dto: CreateLaneDto) {
    const data = await this.laneService.createLane(siteId, dto);
    return {
      message: 'Tạo làn xe thành công',
      data,
    };
  }

  @Patch('parking-lanes/:laneId/mode')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Đổi chế độ vận hành làn (AUTO_AI, MANUAL_STAFF, EMERGENCY_OPEN, CLOSED)' })
  async updateMode(
    @Param('laneId') laneId: string,
    @Body('operating_mode') mode: LaneOperatingMode,
  ) {
    const data = await this.laneService.updateMode(laneId, mode);
    return {
      message: `Đã chuyển làn sang chế độ ${mode}`,
      data,
    };
  }
}
