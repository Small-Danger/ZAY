import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CartLineDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  size!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  color!: string;

  @IsInt()
  @Min(0)
  @Max(99)
  @Type(() => Number)
  quantity!: number;
}

export class MergeCartDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  items!: CartLineDto[];
}
