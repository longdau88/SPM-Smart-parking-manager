import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CreateRecognitionEventDto } from '../dto/create-recognition-event.dto';
import { RecognitionEventService } from '../services/recognition-event.service';

@ApiTags('AI Recognition Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recognition-events')
export class RecognitionEventController {
  constructor(private readonly eventService: RecognitionEventService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Ghi nhận kết quả nhận diện biển số từ AI hoặc Edge' })
  async create(@Body() dto: CreateRecognitionEventDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Ghi nhận sự kiện nhận diện thành công', data: await this.eventService.create(dto, tenantId!) };
  }

  @Get('sites/:siteId/recent')
  @ApiQuery({ name: 'limit', required: false })
  async findRecent(
    @Param('siteId') siteId: string,
    @CurrentTenant() tenantId?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ) {
    return { message: 'Lấy sự kiện nhận diện gần nhất thành công', data: await this.eventService.findRecent(siteId, tenantId, limit) };
  }
}
