import { Allow, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSubcategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @Allow()
  @IsOptional()
  image?: unknown;
}
