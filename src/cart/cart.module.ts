import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Store } from '../entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, User, Store]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}