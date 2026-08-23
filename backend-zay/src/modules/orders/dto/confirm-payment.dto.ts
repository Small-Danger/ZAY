import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  sessionId!: string;
}
