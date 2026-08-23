import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ContactSubject } from '@prisma/client';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsEnum(ContactSubject)
  subject!: ContactSubject;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  message!: string;
}
