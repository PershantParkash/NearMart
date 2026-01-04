import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Store } from '../entities/store.entity';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { customer: { id: userId }, isActive: true },
      relations: ['items', 'items.product', 'items.product.store', 'store'],
    });

    if (!cart) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      cart = this.cartRepository.create({
        customer: user,
        items: [],
        totalAmount: 0,
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['store'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if cart has items from a different store
    if (cart.items.length > 0 && cart.store) {
      if (cart.store.id !== product.store.id) {
        throw new ConflictException(
          'Cannot add products from different stores. Please clear your cart first.',
        );
      }
    }

    // Check if product already exists in cart
    const existingItem = cart.items.find(
      (item) => item.product.id === productId,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add more items. Maximum available: ${product.stock}`,
        );
      }
      existingItem.quantity = newQuantity;
      existingItem.subtotal = Number(product.price) * newQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity,
        price: product.price,
        subtotal: Number(product.price) * quantity,
      });
      await this.cartItemRepository.save(cartItem);
      cart.items.push(cartItem);
    }

    // Update cart store if not set
    if (!cart.store) {
      cart.store = product.store;
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    await this.cartRepository.save(cart);

    return this.getOrCreateCart(userId);
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const { quantity } = updateCartItemDto;

    const cart = await this.getOrCreateCart(userId);

    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity > cartItem.product.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${cartItem.product.stock}`,
      );
    }

    cartItem.quantity = quantity;
    cartItem.subtotal = Number(cartItem.price) * quantity;
    await this.cartItemRepository.save(cartItem);

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );
    await this.cartRepository.save(cart);

    return this.getOrCreateCart(userId);
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = cart.items.find((item) => item.id === cartItemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);

    // If cart is now empty, clear the store reference
    const updatedCart = await this.getOrCreateCart(userId);
    if (updatedCart.items.length === 0) {
      updatedCart.store = null;
      updatedCart.totalAmount = 0;
      await this.cartRepository.save(updatedCart);
    } else {
      // Recalculate total
      updatedCart.totalAmount = updatedCart.items.reduce(
        (sum, item) => sum + Number(item.subtotal),
        0,
      );
      await this.cartRepository.save(updatedCart);
    }

    return this.getOrCreateCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.getOrCreateCart(userId);

    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    cart.store = null;
    cart.totalAmount = 0;
    await this.cartRepository.save(cart);
  }

  async getCart(userId: string): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }
}