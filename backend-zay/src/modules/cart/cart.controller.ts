import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Post,
} from '@nestjs/common';
import { AuthRequired } from '../auth/decorators/auth-required.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { CartLineDto, MergeCartDto } from './dto/cart.dto';
import { CartService } from './cart.service';

@Controller('cart')
@AuthRequired()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.cartService.findMine(user.id);
  }

  /** Fusionne le panier local (invitée) dans le panier compte. */
  @Post('merge')
  merge(@CurrentUser() user: AuthUser, @Body() dto: MergeCartDto) {
    return this.cartService.merge(user.id, dto);
  }

  /** Crée / met à jour / retire (quantity 0) une ligne. */
  @Put('item')
  upsert(@CurrentUser() user: AuthUser, @Body() dto: CartLineDto) {
    return this.cartService.upsert(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clear(@CurrentUser() user: AuthUser) {
    return this.cartService.clear(user.id);
  }
}
