import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ enum: ['VIETQR', 'CASH'], default: 'VIETQR' })
  @IsEnum(['VIETQR', 'CASH'])
  @IsOptional()
  payment_method?: 'VIETQR' | 'CASH';
}
