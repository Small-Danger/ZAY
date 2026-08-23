import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/** JWT obligatoire (cliente ou admin). */
export function AuthRequired() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}
