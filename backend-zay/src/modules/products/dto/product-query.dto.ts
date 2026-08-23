import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

const toOptionalBoolean = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
};

export class ProductQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(toOptionalBoolean)
  isNew?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(toOptionalBoolean)
  isPromo?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
