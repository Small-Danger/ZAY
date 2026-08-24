import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function parseMaybeBoolean(value: unknown) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

/** multipart JSON string OU tableau JSON — instancie le DTO (sinon forbidNonWhitelisted rejette size/color…). */
export function transformVariants(value: unknown) {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return value;
    }
  }
  if (!Array.isArray(raw)) return raw;
  return plainToInstance(CreateProductVariantDto, raw);
}

/** Liste d’URLs galerie (JSON string en multipart). */
export function transformImages(value: unknown) {
  let raw = value;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return value;
    }
  }
  return raw;
}

export class CreateProductVariantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  size!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  colorName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  colorHex?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock!: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  originalPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  /** URL / path — optionnel si un fichier `image` est uploadé en multipart */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value : undefined))
  @IsString()
  @IsNotEmpty()
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  badge?: string;

  @IsOptional()
  @Transform(({ value }) => parseMaybeBoolean(value))
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseMaybeBoolean(value))
  @IsBoolean()
  isPromo?: boolean;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @Transform(({ value }) => transformImages(value))
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @Transform(({ value }) => transformVariants(value))
  @IsArray()
  @ValidateNested({ each: true })
  variants?: CreateProductVariantDto[];
}
