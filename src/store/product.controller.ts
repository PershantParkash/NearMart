import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from './dto/product.dto';
import { Roles, CurrentUser, Public } from '../common/decorators/decorators';
import { UserRole } from '../entities/user.entity';
import { StoreService } from './store.service';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
export class ProductController {
  constructor(
    private productService: ProductService,
    private storeService: StoreService,
  ) {}

  @Post()
  @Roles(UserRole.SHOPKEEPER)
  @ApiOperation({ summary: 'Create product (Shopkeeper only)' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ) {
    const store = await this.storeService.findByShopkeeper(user.userId);
    return this.productService.createProduct(createProductDto, store.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getAllProducts() {
    return this.productService.findAll();
  }

  @Get('store/:storeId')
  @Public()
  @ApiOperation({ summary: 'Get products by store' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getProductsByStore(@Param('storeId') storeId: string) {
    return this.productService.findByStore(storeId);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async searchProducts(
    @Query('q') query: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.productService.searchProducts(query, storeId);
  }

  @Get('inventory')
  @Roles(UserRole.ADMIN, UserRole.SHOPKEEPER)
  @ApiOperation({ summary: 'Get inventory (Admin: all, Shopkeeper: own store)' })
  @ApiResponse({ status: 200 })
  async getInventory(@CurrentUser() user: any) {
    if (user.role === UserRole.ADMIN) {
      return this.productService.getInventory();
    }

    const store = await this.storeService.findByShopkeeper(user.userId);
    return this.productService.getInventory(store.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SHOPKEEPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update product (Shopkeeper/Admin)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productService.updateProduct(
      id,
      updateProductDto,
      user.userId,
      user.role,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SHOPKEEPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete product (Shopkeeper/Admin)' })
  @ApiResponse({ status: 200 })
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    await this.productService.deleteProduct(id, user.userId, user.role);
    return { message: 'Product deleted successfully' };
  }
}