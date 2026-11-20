import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CalculateFeeDto } from '../dto/calculate-fee.dto';
import { CreatePricingRuleDto } from '../dto/create-pricing-rule.dto';
import { PricingRuleService } from '../services/pricing-rule.service';

@ApiTags('Billing & Pricing Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing-rules')
export class PricingRuleController {
  constructor(private readonly pricingService: PricingRuleService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER')
  async create(@Body() dto: CreatePricingRuleDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Tạo quy tắc tính phí thành công', data: await this.pricingService.create(dto, tenantId) };
  }

  @Get('sites/:siteId')
  async findBySite(@Param('siteId') siteId: string, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Lấy danh sách quy tắc tính phí thành công', data: await this.pricingService.findBySite(siteId, tenantId) };
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Tính phí thử theo quy tắc đang hoạt động' })
  async calculate(@Body() dto: CalculateFeeDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Tính phí thành công', data: await this.pricingService.calculate(dto, tenantId) };
  }
}
