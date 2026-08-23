import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PromoType } from '@prisma/client';

export class CreatePromoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @IsEnum(PromoType)
  type!: PromoType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePromoDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code?: string;

  @IsOptional()
  @IsEnum(PromoType)
  type?: PromoType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value?: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  usageLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class ValidatePromoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  code!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal!: number;
}
