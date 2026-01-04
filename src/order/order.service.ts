import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Cart } from '../entities/cart.entity';
import { User, UserRole } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Store } from '../entities/store.entity';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AssignRiderDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async findAvailableRider(storeId: string): Promise<User | null> {
    // Find riders who don't have active orders (OUT_FOR_DELIVERY status)
    const riders = await this.userRepository.find({
      where: { role: UserRole.RIDER, isActive: true },
    });

    if (riders.length === 0) {
      return null;
    }

    // Check each rider for active deliveries
    for (const rider of riders) {
      const activeOrders = await this.orderRepository.count({
        where: {
          rider: { id: rider.id },
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      if (activeOrders === 0) {
        return rider; // Found an available rider
      }
    }

    return null; // All riders are busy
  }

  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const {
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      customerPhone,
      specialInstructions,
    } = createOrderDto;

    // Get customer's cart
    const cart = await this.cartRepository.findOne({
      where: { customer: { id: userId }, isActive: true },
      relations: ['items', 'items.product', 'items.product.store', 'store'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    if (!cart.store) {
      throw new BadRequestException('No store associated with cart');
    }

    // Check if store can deliver to customer location
    const distance = this.calculateDistance(
      Number(cart.store.latitude),
      Number(cart.store.longitude),
      deliveryLatitude,
      deliveryLongitude,
    );

    if (distance > Number(cart.store.deliveryRadius)) {
      throw new BadRequestException(
        `Store cannot deliver to your location. Maximum delivery radius: ${cart.store.deliveryRadius}km, Your distance: ${distance.toFixed(2)}km`,
      );
    }

    // Verify stock availability for all items
    for (const cartItem of cart.items) {
      const product = await this.productRepository.findOne({
        where: { id: cartItem.product.id },
      });

      if (!product || !product.isActive) {
        throw new BadRequestException(
          `Product ${cartItem.product.name} is no longer available`,
        );
      }

      if (product.stock < cartItem.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        );
      }
    }

    const customer = await this.userRepository.findOne({
      where: { id: userId },
    });

    // Calculate delivery fee based on distance
    const deliveryFee = distance <= 2 ? 50 : 50 + (distance - 2) * 20;

    // Try to auto-assign rider
    const availableRider = await this.findAvailableRider(cart.store.id);

    // Create order
    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      customer,
      store: cart.store,
      rider: availableRider,
      status: OrderStatus.PENDING,
      subtotal: cart.totalAmount,
      deliveryFee,
      totalAmount: Number(cart.totalAmount) + deliveryFee,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      customerPhone,
      specialInstructions,
      isRiderAutoAssigned: !!availableRider,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and reduce stock
    for (const cartItem of cart.items) {
      const orderItem = this.orderItemRepository.create({
        order: savedOrder,
        product: cartItem.product,
        productName: cartItem.product.name,
        price: cartItem.price,
        quantity: cartItem.quantity,
        subtotal: cartItem.subtotal,
      });
      await this.orderItemRepository.save(orderItem);

      // Reduce product stock
      await this.productRepository.decrement(
        { id: cartItem.product.id },
        'stock',
        cartItem.quantity,
      );
    }

    // Clear cart
    await this.cartRepository.remove(cart);

    return this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
    });
  }

  async getOrderById(orderId: string, userId: string, userRole: UserRole): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Access control
    if (userRole === UserRole.CUSTOMER && order.customer.id !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    if (userRole === UserRole.SHOPKEEPER) {
      const store = await this.storeRepository.findOne({
        where: { shopkeeper: { id: userId } },
      });
      if (!store || store.id !== order.store.id) {
        throw new ForbiddenException('You can only view orders from your store');
      }
    }

    if (userRole === UserRole.RIDER && order.rider?.id !== userId) {
      throw new ForbiddenException('You can only view your assigned orders');
    }

    return order;
  }

  async getCustomerOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customer: { id: userId } },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStoreOrders(userId: string): Promise<Order[]> {
    const store = await this.storeRepository.findOne({
      where: { shopkeeper: { id: userId } },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this shopkeeper');
    }

    return this.orderRepository.find({
      where: { store: { id: store.id } },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRiderOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { rider: { id: userId } },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    userRole: UserRole,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const { status, cancellationReason } = updateOrderStatusDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'store', 'rider', 'items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Authorization checks
    if (userRole === UserRole.CUSTOMER) {
      if (order.customer.id !== userId) {
        throw new ForbiddenException('You can only update your own orders');
      }
      // Customers can only cancel orders
      if (status !== OrderStatus.CANCELLED) {
        throw new ForbiddenException('Customers can only cancel orders');
      }
      if (
        order.status === OrderStatus.OUT_FOR_DELIVERY ||
        order.status === OrderStatus.DELIVERED
      ) {
        throw new BadRequestException('Cannot cancel order at this stage');
      }
    }

    if (userRole === UserRole.SHOPKEEPER) {
      const store = await this.storeRepository.findOne({
        where: { shopkeeper: { id: userId } },
      });
      if (!store || store.id !== order.store.id) {
        throw new ForbiddenException(
          'You can only update orders from your store',
        );
      }
    }

    if (userRole === UserRole.RIDER) {
      if (!order.rider || order.rider.id !== userId) {
        throw new ForbiddenException('You can only update your assigned orders');
      }
      // Riders can only update to OUT_FOR_DELIVERY or DELIVERED
      if (
        status !== OrderStatus.OUT_FOR_DELIVERY &&
        status !== OrderStatus.DELIVERED
      ) {
        throw new ForbiddenException(
          'Riders can only mark orders as out for delivery or delivered',
        );
      }
    }

    // Update order status
    order.status = status;

    // Set timestamps based on status
    const now = new Date();
    if (status === OrderStatus.CONFIRMED && !order.confirmedAt) {
      order.confirmedAt = now;
    } else if (status === OrderStatus.PREPARING && !order.preparingAt) {
      order.preparingAt = now;
    } else if (status === OrderStatus.OUT_FOR_DELIVERY && !order.outForDeliveryAt) {
      order.outForDeliveryAt = now;
    } else if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = now;
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = now;
      order.cancellationReason = cancellationReason;

      // Restore product stock
      for (const item of order.items) {
        await this.productRepository.increment(
          { id: item.product.id },
          'stock',
          item.quantity,
        );
      }
    }

    await this.orderRepository.save(order);

    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
    });
  }

  async assignRider(
    orderId: string,
    userId: string,
    userRole: UserRole,
    assignRiderDto: AssignRiderDto,
  ): Promise<Order> {
    const { riderId } = assignRiderDto;

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['store'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only shopkeeper and admin can manually assign riders
    if (userRole === UserRole.SHOPKEEPER) {
      const store = await this.storeRepository.findOne({
        where: { shopkeeper: { id: userId } },
      });
      if (!store || store.id !== order.store.id) {
        throw new ForbiddenException(
          'You can only assign riders to orders from your store',
        );
      }
    }

    const rider = await this.userRepository.findOne({
      where: { id: riderId, role: UserRole.RIDER, isActive: true },
    });

    if (!rider) {
      throw new NotFoundException('Rider not found or inactive');
    }

    order.rider = rider;
    order.isRiderAutoAssigned = false;
    await this.orderRepository.save(order);

    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['customer', 'store', 'rider', 'items', 'items.product'],
    });
  }

  async getAvailableRiders(): Promise<User[]> {
    const riders = await this.userRepository.find({
      where: { role: UserRole.RIDER, isActive: true },
    });

    const availableRiders = [];
    for (const rider of riders) {
      const activeOrders = await this.orderRepository.count({
        where: {
          rider: { id: rider.id },
          status: OrderStatus.OUT_FOR_DELIVERY,
        },
      });

      if (activeOrders === 0) {
        availableRiders.push(rider);
      }
    }

    return availableRiders;
  }
}