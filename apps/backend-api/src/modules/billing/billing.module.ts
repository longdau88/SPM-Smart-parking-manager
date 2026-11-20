import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParkingSiteEntity } from '../parking/entities/parking-site.entity';
import { PricingRuleController } from './controllers/pricing-rule.controller';
import { PricingRuleEntity } from './entities/pricing-rule.entity';
import { PricingRuleService } from './services/pricing-rule.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentController } from './controllers/payment.controller';
import { PaymentService } from './services/payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([PricingRuleEntity, ParkingSiteEntity, InvoiceEntity, PaymentTransactionEntity])],
  controllers: [PricingRuleController, PaymentController],
  providers: [PricingRuleService, PaymentService],
  exports: [PricingRuleService, PaymentService, TypeOrmModule],
})
export class BillingModule {}
