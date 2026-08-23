import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;
}
