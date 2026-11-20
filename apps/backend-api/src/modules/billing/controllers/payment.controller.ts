import { BadRequestException, Body, Controller, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Public } from '../../../common/decorators/public.decorator';
import { CashConfirmDto } from '../dto/cash-confirm.dto';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { VietQrWebhookDto } from '../dto/vietqr-webhook.dto';
import { PaymentService } from '../services/payment.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('sessions/:sessionId/invoice')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Tạo hóa đơn và mã VietQR cho phiên xe' })
  async createInvoice(@Param('sessionId') sessionId: string, @Body() dto: CreateInvoiceDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Tạo hóa đơn thành công', data: await this.paymentService.createInvoice(sessionId, dto, tenantId) };
  }

  @Post('cash-confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'STAFF')
  async cashConfirm(@Body() dto: CashConfirmDto, @CurrentTenant() tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Thiếu tenant context');
    return { message: 'Xác nhận tiền mặt thành công', data: await this.paymentService.confirmCash(dto, tenantId) };
  }

  @Post('vietqr/webhook')
  @Public()
  @ApiOperation({ summary: 'Webhook VietQR/Napas có xác thực HMAC-SHA256' })
  async webhook(@Body() dto: VietQrWebhookDto, @Headers('x-signature') signature: string | undefined, @Req() request: Request & { rawBody?: Buffer }) {
    const rawPayload = request.rawBody?.toString('utf8') ?? JSON.stringify(dto);
    return { message: 'Đã tiếp nhận webhook thanh toán', data: await this.paymentService.processVietQrWebhook(dto, signature, rawPayload) };
  }
}
