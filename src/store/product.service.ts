import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Store } from '../entities/store.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
    storeId: string,
  ): Promise<Product> {
    const store = await this.storeRepository.findOne({ where: { id: storeId } });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      store,
    });

    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStore(storeId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { store: { id: storeId } },
      relations: ['store'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    userId: string,
    userRole: string,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Check if shopkeeper owns the store
    if (userRole === 'SHOPKEEPER') {
      const store = await this.storeRepository.findOne({
        where: { shopkeeper: { id: userId } },
      });

      if (!store || store.id !== product.store.id) {
        throw new ForbiddenException('You can only update products in your own store');
      }
    }

    Object.assign(product, updateProductDto);

    return this.productRepository.save(product);
  }

  async deleteProduct(id: string, userId: string, userRole: string): Promise<void> {
    const product = await this.findOne(id);

    // Check if shopkeeper owns the store
    if (userRole === 'SHOPKEEPER') {
      const store = await this.storeRepository.findOne({
        where: { shopkeeper: { id: userId } },
      });

      if (!store || store.id !== product.store.id) {
        throw new ForbiddenException('You can only delete products in your own store');
      }
    }

    await this.productRepository.delete(id);
  }

  async searchProducts(query: string, storeId?: string): Promise<Product[]> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query OR product.category ILIKE :query)',
        { query: `%${query}%` },
      );

    if (storeId) {
      queryBuilder.andWhere('store.id = :storeId', { storeId });
    }

    return queryBuilder.getMany();
  }

  async getInventory(storeId?: string) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.store', 'store')
      .select([
        'product.id',
        'product.name',
        'product.sku',
        'product.stock',
        'product.price',
        'product.category',
        'store.id',
        'store.name',
      ]);

    if (storeId) {
      queryBuilder.where('store.id = :storeId', { storeId });
    }

    return queryBuilder.getMany();
  }
}