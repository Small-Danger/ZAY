import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  carrier?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  trackingCode?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(300)
  trackingUrl?: string;
}
