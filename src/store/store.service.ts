import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Store } from '../entities/store.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createStore(createStoreDto: CreateStoreDto): Promise<Store> {
    const { shopkeeperEmail, shopkeeperName, shopkeeperPassword, ...storeData } = createStoreDto;

    // Check if shopkeeper email already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email: shopkeeperEmail } 
    });
    if (existingUser) {
      throw new ConflictException('Shopkeeper email already exists');
    }

    // Check if shopkeeper already owns a store
    const existingStore = await this.storeRepository.findOne({
      where: { shopkeeper: { email: shopkeeperEmail } },
    });
    if (existingStore) {
      throw new ConflictException('Shopkeeper already owns a store');
    }

    // Create shopkeeper user
    const hashedPassword = await bcrypt.hash(shopkeeperPassword, 10);
    const shopkeeper = this.userRepository.create({
      email: shopkeeperEmail,
      fullName: shopkeeperName,
      password: hashedPassword,
      role: UserRole.SHOPKEEPER,
    });
    await this.userRepository.save(shopkeeper);

    // Create store
    const store = this.storeRepository.create({
      ...storeData,
      shopkeeper,
    });

    return this.storeRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepository.find({
      relations: ['shopkeeper'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id },
      relations: ['shopkeeper'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async findByShopkeeper(shopkeeperId: string): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { shopkeeper: { id: shopkeeperId } },
      relations: ['shopkeeper'],
    });

    if (!store) {
      throw new NotFoundException('Store not found for this shopkeeper');
    }

    return store;
  }

  async updateStore(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);

    Object.assign(store, updateStoreDto);

    return this.storeRepository.save(store);
  }

  async deleteStore(id: string): Promise<void> {
    const store = await this.findOne(id);

    // Delete shopkeeper user
    await this.userRepository.delete(store.shopkeeper.id);

    // Delete store (products will be cascade deleted)
    await this.storeRepository.delete(id);
  }

  async findNearbyStores(latitude: number, longitude: number): Promise<Store[]> {
    // Haversine formula to calculate distance
    const stores = await this.storeRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.shopkeeper', 'shopkeeper')
      .where('store.isActive = :isActive', { isActive: true })
      .getMany();

    return stores.filter(store => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(store.latitude),
        Number(store.longitude),
      );
      return distance <= Number(store.deliveryRadius);
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}