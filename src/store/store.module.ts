import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Store } from '../entities/store.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Product, User])],
  controllers: [StoreController, ProductController],
  providers: [StoreService, ProductService],
  exports: [StoreService, ProductService],
})
export class StoreModule {}