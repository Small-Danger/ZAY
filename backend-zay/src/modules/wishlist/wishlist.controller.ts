import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { AuthRequired } from '../auth/decorators/auth-required.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { ToggleWishlistDto } from './dto/toggle-wishlist.dto';
import { WishlistService } from './wishlist.service';

@Controller('wishlist')
@AuthRequired()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findMine(@CurrentUser() user: AuthUser) {
    return this.wishlistService.findMine(user.id);
  }

  @Post('toggle')
  toggle(@CurrentUser() user: AuthUser, @Body() dto: ToggleWishlistDto) {
    return this.wishlistService.toggle(user.id, dto.productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.wishlistService.remove(user.id, productId);
  }
}
