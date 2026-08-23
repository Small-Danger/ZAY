import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  /** Début de période (ISO date ou datetime) */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Fin de période (ISO date ou datetime) */
  @IsOptional()
  @IsDateString()
  to?: string;
}
