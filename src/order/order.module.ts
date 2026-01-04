import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { User } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Store } from '../entities/store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, User, Product, Store]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}