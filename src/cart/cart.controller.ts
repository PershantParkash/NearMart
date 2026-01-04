import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto/cart.dto';
import { CurrentUser } from '../common/decorators/decorators';
import { Roles } from '../common/decorators/decorators';
import { UserRole } from '../entities/user.entity';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@Roles(UserRole.CUSTOMER)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get customer cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.userId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add product to cart' })
  @ApiResponse({ status: 201, type: CartResponseDto })
  async addToCart(
    @CurrentUser() user: any,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.userId, addToCartDto);
  }

  @Put('items/:cartItemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async updateCartItem(
    @CurrentUser() user: any,
    @Param('cartItemId') cartItemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      user.userId,
      cartItemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:cartItemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.cartService.removeFromCart(user.userId, cartItemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(@CurrentUser() user: any) {
    await this.cartService.clearCart(user.userId);
    return { message: 'Cart cleared successfully' };
  }
}