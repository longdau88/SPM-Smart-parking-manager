import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParkingLayoutService } from '../services/parking-layout.service';
import { CreateFloorDto } from '../dto/create-floor.dto';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { UpdateSlotStatusDto } from '../dto/update-slot-status.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Parking Spatial Digital Twin (Layout, Floors, Zones, Slots)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ParkingLayoutController {
  constructor(private readonly layoutService: ParkingLayoutService) {}

  @Get('parking-sites/:siteId/layout')
  @ApiOperation({ summary: 'Lấy sơ đồ số Digital Twin 2D của toàn bộ bãi xe' })
  async getLayout(@Param('siteId') siteId: string) {
    const data = await this.layoutService.getDigitalTwinLayout(siteId);
    return {
      message: 'Lấy sơ đồ bãi xe thành công',
      data,
    };
  }

  @Post('parking-sites/:siteId/floors')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Thêm tầng đỗ xe mới cho bãi' })
  async createFloor(@Param('siteId') siteId: string, @Body() dto: CreateFloorDto) {
    const data = await this.layoutService.createFloor(siteId, dto);
    return {
      message: 'Tạo tầng đỗ xe thành công',
      data,
    };
  }

  @Post('floors/:floorId/zones')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Thêm khu vực phân vùng trong tầng' })
  async createZone(@Param('floorId') floorId: string, @Body() dto: CreateZoneDto) {
    const data = await this.layoutService.createZone(floorId, dto);
    return {
      message: 'Tạo khu vực thành công',
      data,
    };
  }

  @Post('zones/:zoneId/slots')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Thêm vị trí ô đỗ cụ thể vào khu vực' })
  async createSlot(@Param('zoneId') zoneId: string, @Body() dto: CreateSlotDto) {
    const data = await this.layoutService.createSlot(zoneId, dto);
    return {
      message: 'Tạo ô đỗ xe thành công',
      data,
    };
  }

  @Patch('slots/:slotId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái ô đỗ (Cảm biến siêu âm / IoT kích hoạt)' })
  async updateSlotStatus(@Param('slotId') slotId: string, @Body() dto: UpdateSlotStatusDto) {
    const data = await this.layoutService.updateSlotStatus(slotId, dto);
    return {
      message: 'Cập nhật trạng thái ô đỗ thành công',
      data,
    };
  }
}
