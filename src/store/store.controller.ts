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
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto, StoreResponseDto } from './dto/store.dto';
import { Roles, CurrentUser } from '../common/decorators/decorators';
import { UserRole } from '../entities/user.entity';

@ApiTags('Stores')
@ApiBearerAuth('JWT-auth')
@Controller('stores')
export class StoreController {
  constructor(private storeService: StoreService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new store (Admin only)' })
  @ApiResponse({ status: 201, type: StoreResponseDto })
  async createStore(@Body() createStoreDto: CreateStoreDto) {
    return this.storeService.createStore(createStoreDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all stores (Admin only)' })
  @ApiResponse({ status: 200, type: [StoreResponseDto] })
  async getAllStores() {
    return this.storeService.findAll();
  }

  @Get('my-store')
  @Roles(UserRole.SHOPKEEPER)
  @ApiOperation({ summary: 'Get shopkeeper own store' })
  @ApiResponse({ status: 200, type: StoreResponseDto })
  async getMyStore(@CurrentUser() user: any) {
    return this.storeService.findByShopkeeper(user.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stores near customer location' })
  @ApiResponse({ status: 200, type: [StoreResponseDto] })
  async getNearbyStores(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    return this.storeService.findNearbyStores(latitude, longitude);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiResponse({ status: 200, type: StoreResponseDto })
  async getStore(@Param('id') id: string) {
    return this.storeService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update store (Admin only)' })
  @ApiResponse({ status: 200, type: StoreResponseDto })
  async updateStore(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storeService.updateStore(id, updateStoreDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete store (Admin only)' })
  @ApiResponse({ status: 200 })
  async deleteStore(@Param('id') id: string) {
    await this.storeService.deleteStore(id);
    return { message: 'Store deleted successfully' };
  }
}