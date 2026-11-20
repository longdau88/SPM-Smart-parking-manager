import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class BarrierControlDto {
  @IsUUID()
  site_id: string;

  @IsIn(['OPEN', 'CLOSE'])
  action: 'OPEN' | 'CLOSE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  operator_note?: string;
}
