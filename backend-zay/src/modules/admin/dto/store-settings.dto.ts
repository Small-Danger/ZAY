import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateStoreSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeName?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  shippingCost?: number;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  freeShippingThreshold?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  legalName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tradeName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  legalForm?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shareCapital?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  siret?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  rcsCity?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  vatNumber?: string | null;

  @IsOptional()
  @IsBoolean()
  vatFranchise?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  legalAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  publicationDirector?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  showroomAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  openingHours?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  hostName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  hostAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  hostContact?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  mediatorName?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  mediatorUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  instagramUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  tiktokUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  eventTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  eventSubtitle?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsDateString()
  eventDate?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  eventImageUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  eventLink?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  eventPartners?: string | null;
}
