import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class EdgeIngestionDto {
  @IsUUID()
  edge_event_id: string;

  @IsUUID()
  @IsOptional()
  tenant_id?: string;

  @IsUUID()
  site_id: string;

  @IsUUID()
  lane_id: string;

  @IsString()
  event_type: string;

  @IsOptional()
  @IsEnum(['IN', 'OUT'])
  direction?: 'IN' | 'OUT';

  @IsOptional()
  @IsString()
  clean_plate?: string;

  @IsOptional()
  @IsString()
  display_plate?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
