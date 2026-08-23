import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Mise à jour — image via fichier multipart optionnel (`image`). */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;
}
