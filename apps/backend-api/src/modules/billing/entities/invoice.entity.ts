import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ParkingSiteEntity } from '../../parking/entities/parking-site.entity';

@Entity('invoices')
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  site_id: string;

  @ManyToOne(() => ParkingSiteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'site_id' })
  site: ParkingSiteEntity;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoice_number: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  final_amount: number;

  @Column({ type: 'varchar', length: 30, default: 'VIETQR' })
  payment_method: 'VIETQR' | 'CASH' | 'MOMO' | 'ZALOPAY' | 'CREDIT_CARD';

  @Column({ type: 'varchar', length: 30, default: 'PENDING' })
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

  @Column({ type: 'boolean', default: false })
  einvoice_synced: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  einvoice_code: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
