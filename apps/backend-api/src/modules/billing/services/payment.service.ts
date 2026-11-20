import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingSessionEntity } from '../../session/entities/parking-session.entity';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { CashConfirmDto } from '../dto/cash-confirm.dto';
import { VietQrWebhookDto } from '../dto/vietqr-webhook.dto';
import { InvoiceEntity } from '../entities/invoice.entity';
import { PaymentTransactionEntity } from '../entities/payment-transaction.entity';
import { Optional } from '@nestjs/common';
import { RealtimeGateway } from '../../operations/realtime.gateway';

export interface PaymentResponse {
  invoice_id: string;
  invoice_number: string;
  amount: number;
  payment_method: InvoiceEntity['payment_method'];
  status: InvoiceEntity['status'];
  vietqr_payload: string;
  action_required?: 'OPEN_EXIT_BARRIER';
  session_status?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(InvoiceEntity)
    private readonly invoiceRepository: Repository<InvoiceEntity>,
    @InjectRepository(PaymentTransactionEntity)
    private readonly transactionRepository: Repository<PaymentTransactionEntity>,
    @InjectRepository(ParkingSessionEntity)
    private readonly sessionRepository: Repository<ParkingSessionEntity>,
    @Optional() private readonly realtime?: RealtimeGateway,
  ) {}

  async createInvoice(sessionId: string, dto: CreateInvoiceDto, tenantId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId, tenant_id: tenantId } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên gửi xe');
    if (session.status !== 'PENDING_PAYMENT') throw new ConflictException('Phiên chưa sẵn sàng thanh toán');
    const existing = await this.invoiceRepository.findOne({ where: { session_id: session.id, status: 'PENDING' } });
    if (existing) return this.invoiceResponse(existing);

    const invoice = await this.invoiceRepository.save(this.invoiceRepository.create({
      tenant_id: tenantId,
      site_id: session.site_id,
      session_id: session.id,
      invoice_number: `SPM-${Date.now()}-${session.id.slice(0, 8).toUpperCase()}`,
      amount: session.calculated_fee,
      final_amount: session.calculated_fee,
      payment_method: dto.payment_method ?? 'VIETQR',
      status: 'PENDING',
    }));
    return this.invoiceResponse(invoice);
  }

  async confirmCash(dto: CashConfirmDto, tenantId: string) {
    return this.completePayment(dto.invoice_id, tenantId, 'CASH', `CASH-${Date.now()}`, dto.operator_note);
  }

  async processVietQrWebhook(dto: VietQrWebhookDto, signature: string | undefined, rawPayload: string) {
    this.verifySignature(rawPayload, signature);
    const invoice = await this.invoiceRepository.findOne({ where: { id: dto.invoice_id } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (invoice.status === 'COMPLETED') return this.invoiceResponse(invoice);
    if (Number(invoice.final_amount) !== Number(dto.amount)) {
      throw new UnprocessableEntityException('Số tiền webhook không khớp hóa đơn');
    }
    return this.completePayment(dto.invoice_id, invoice.tenant_id, 'VIETQR_NAPAS', dto.transaction_reference, dto.gateway_response);
  }

  private async completePayment(
    invoiceId: string,
    tenantId: string,
    provider: string,
    reference: string,
    response?: unknown,
  ) {
    const invoice = await this.invoiceRepository.findOne({ where: { id: invoiceId, tenant_id: tenantId } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (invoice.status === 'COMPLETED') return this.invoiceResponse(invoice);
    const duplicate = await this.transactionRepository.findOne({ where: { transaction_reference: reference } });
    if (duplicate) throw new ConflictException('Giao dịch đã được xử lý');

    const session = await this.sessionRepository.findOne({ where: { id: invoice.session_id, tenant_id: tenantId } });
    if (!session) throw new NotFoundException('Không tìm thấy phiên gửi xe của hóa đơn');
    if (session.status !== 'PENDING_PAYMENT') throw new ConflictException('Phiên không ở trạng thái chờ thanh toán');

    invoice.status = 'COMPLETED';
    const savedInvoice = await this.invoiceRepository.save(invoice);
    await this.transactionRepository.save(this.transactionRepository.create({
      invoice_id: invoice.id,
      gateway_provider: provider,
      transaction_reference: reference,
      gateway_response: typeof response === 'object' && response !== null ? response as Record<string, unknown> : undefined,
      amount: invoice.final_amount,
      status: 'SUCCESS',
      verified_at: new Date(),
    }));
    session.paid_fee = invoice.final_amount;
    session.payment_status = 'PAID';
    session.status = 'COMPLETED';
    await this.sessionRepository.save(session);
    this.realtime?.emitSite(tenantId, session.site_id, 'cabin.event', {
      type: 'PAYMENT_COMPLETED',
      session_id: session.id,
      invoice_id: invoice.id,
      payment_status: session.payment_status,
      status: session.status,
      action_required: 'OPEN_EXIT_BARRIER',
    });
    return { ...this.invoiceResponse(savedInvoice), action_required: 'OPEN_EXIT_BARRIER', session_status: session.status };
  }

  private invoiceResponse(invoice: InvoiceEntity): PaymentResponse {
    const bankId = process.env.VIETQR_BANK_ID ?? '970422';
    const account = process.env.VIETQR_ACCOUNT_NUMBER ?? '0000000000';
    const name = encodeURIComponent(process.env.VIETQR_ACCOUNT_NAME ?? 'SPM PARKING');
    const content = encodeURIComponent(invoice.invoice_number);
    return {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: Number(invoice.final_amount),
      payment_method: invoice.payment_method,
      status: invoice.status,
      vietqr_payload: `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${invoice.final_amount}&addInfo=${content}&accountName=${name}`,
    };
  }

  private verifySignature(payload: string, signature?: string) {
    const secret = process.env.VIETQR_WEBHOOK_SECRET;
    if (!secret) throw new UnauthorizedException('Chưa cấu hình VIETQR_WEBHOOK_SECRET');
    if (!signature) throw new UnauthorizedException('Thiếu chữ ký webhook');
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const provided = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expected, 'utf8');
    if (provided.length !== expectedBuffer.length || !timingSafeEqual(provided, expectedBuffer)) {
      throw new UnauthorizedException('Chữ ký webhook không hợp lệ');
    }
  }
}
