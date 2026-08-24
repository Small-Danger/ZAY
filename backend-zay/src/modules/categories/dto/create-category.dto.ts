import { Allow, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Création catégorie — l’image passe en fichier multipart (`image`), pas en URL. */
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  /** Fichier multer : parfois resté dans le body, ignoré ici. */
  @Allow()
  @IsOptional()
  image?: unknown;
}
