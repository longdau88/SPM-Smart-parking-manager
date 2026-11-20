import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class VietQrWebhookDto {
  @ApiProperty()
  @IsUUID()
  invoice_id: string;

  @ApiProperty({ example: 'NAPAS-20261119-0001' })
  @IsString()
  @IsNotEmpty()
  transaction_reference: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ required: false })
  gateway_response?: Record<string, unknown>;
}
