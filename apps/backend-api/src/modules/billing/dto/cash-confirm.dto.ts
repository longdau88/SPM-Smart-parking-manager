import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CashConfirmDto {
  @ApiProperty()
  @IsUUID()
  invoice_id: string;

  @ApiProperty({ example: 'Thu tiền mặt tại quầy L01_OUT' })
  @IsString()
  @IsNotEmpty()
  operator_note: string;
}
