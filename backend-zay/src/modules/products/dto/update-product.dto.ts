import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  CreateProductVariantDto,
  transformImages,
  transformVariants,
} from './create-product.dto';

function parseMaybeBoolean(value: unknown) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
}

/** '' / 'null' / null → null (efface le prix barré). */
function parseOptionalNullableNumber(value: unknown) {
  if (value === '' || value === 'null' || value === null) return null;
  if (value === undefined) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : value;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @Transform(({ value }) => parseOptionalNullableNumber(value))
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsNumber()
  @Min(0)
  originalPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string | null;

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
