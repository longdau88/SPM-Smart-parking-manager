import { createHmac } from 'node:crypto';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { ParkingSessionEntity } from '../../session/entities/parking-session.entity';
import { InvoiceEntity } from '../entities/invoice.entity';
import { PaymentTransactionEntity } from '../entities/payment-transaction.entity';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  const invoiceRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const transactionRepository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const sessionRepository = { findOne: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: getRepositoryToken(InvoiceEntity), useValue: invoiceRepository },
        { provide: getRepositoryToken(PaymentTransactionEntity), useValue: transactionRepository },
        { provide: getRepositoryToken(ParkingSessionEntity), useValue: sessionRepository },
      ],
    }).compile();
    service = module.get(PaymentService);
    invoiceRepository.create.mockImplementation((value) => value);
    transactionRepository.create.mockImplementation((value) => value);
    invoiceRepository.save.mockImplementation((value) => Promise.resolve({ id: 'invoice-1', ...value }));
    transactionRepository.save.mockImplementation((value) => Promise.resolve(value));
    sessionRepository.save.mockImplementation((value) => Promise.resolve(value));
  });

  it('creates a pending invoice with VietQR data', async () => {
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      tenant_id: 'tenant-1',
      site_id: 'site-1',
      status: 'PENDING_PAYMENT',
      calculated_fee: 50000,
    });
    invoiceRepository.findOne.mockResolvedValue(null);
    const result = await service.createInvoice('session-1', { payment_method: 'VIETQR' }, 'tenant-1');
    expect(result).toMatchObject({ amount: 50000, status: 'PENDING', payment_method: 'VIETQR' });
    expect(result.vietqr_payload).toContain('amount=50000');
  });

  it('completes cash payment and closes the session', async () => {
    invoiceRepository.findOne.mockResolvedValue({
      id: 'invoice-1',
      tenant_id: 'tenant-1',
      session_id: 'session-1',
      final_amount: 50000,
      status: 'PENDING',
      invoice_number: 'SPM-1',
      payment_method: 'CASH',
    });
    transactionRepository.findOne.mockResolvedValue(null);
    sessionRepository.findOne.mockResolvedValue({
      id: 'session-1',
      tenant_id: 'tenant-1',
      status: 'PENDING_PAYMENT',
    });
    const result = await service.confirmCash({ invoice_id: 'invoice-1', operator_note: 'F4' }, 'tenant-1');
    expect(result).toMatchObject({ session_status: 'COMPLETED', action_required: 'OPEN_EXIT_BARRIER' });
    expect(invoiceRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED' }));
    expect(sessionRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETED', payment_status: 'PAID' }));
  });

  it('rejects a VietQR webhook with an invalid signature', async () => {
    process.env.VIETQR_WEBHOOK_SECRET = 'test-secret';
    await expect(service.processVietQrWebhook({
      invoice_id: 'invoice-1',
      transaction_reference: 'tx-1',
      amount: 50000,
    }, 'invalid', JSON.stringify({ invoice_id: 'invoice-1' }))).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a signed VietQR webhook with an exact amount', async () => {
    process.env.VIETQR_WEBHOOK_SECRET = 'test-secret';
    const dto = { invoice_id: 'invoice-1', transaction_reference: 'tx-1', amount: 50000 };
    const raw = JSON.stringify(dto);
    const signature = createHmac('sha256', 'test-secret').update(raw).digest('hex');
    invoiceRepository.findOne.mockResolvedValue({
      id: 'invoice-1', tenant_id: 'tenant-1', session_id: 'session-1',
      final_amount: 50000, status: 'PENDING', invoice_number: 'SPM-1', payment_method: 'VIETQR',
    });
    transactionRepository.findOne.mockResolvedValue(null);
    sessionRepository.findOne.mockResolvedValue({ id: 'session-1', tenant_id: 'tenant-1', status: 'PENDING_PAYMENT' });
    const result = await service.processVietQrWebhook(dto, signature, raw);
    expect(result.session_status).toBe('COMPLETED');
  });

  it('rejects amount mismatch and duplicate transaction', async () => {
    invoiceRepository.findOne.mockResolvedValue({
      id: 'invoice-1', tenant_id: 'tenant-1', session_id: 'session-1',
      final_amount: 50000, status: 'PENDING', invoice_number: 'SPM-1', payment_method: 'VIETQR',
    });
    await expect(service.processVietQrWebhook(
      { invoice_id: 'invoice-1', transaction_reference: 'tx-1', amount: 1 },
      undefined,
      '',
    )).rejects.toThrow(UnauthorizedException);
    process.env.VIETQR_WEBHOOK_SECRET = 'test-secret';
    const dto = { invoice_id: 'invoice-1', transaction_reference: 'tx-1', amount: 50000 };
    const raw = JSON.stringify(dto);
    const signature = createHmac('sha256', 'test-secret').update(raw).digest('hex');
    transactionRepository.findOne.mockResolvedValue({ id: 'tx-existing' });
    await expect(service.processVietQrWebhook(dto, signature, raw)).rejects.toThrow(ConflictException);
  });
});
