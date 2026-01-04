import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  AssignRiderDto,
  OrderResponseDto,
} from './dto/order.dto';
import { CurrentUser, Roles } from '../common/decorators/decorators';
import { UserRole } from '../entities/user.entity';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async createOrder(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user.userId, createOrderDto);
  }

  @Get()
  @Roles(UserRole.CUSTOMER, UserRole.SHOPKEEPER, UserRole.RIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get orders based on role' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  async getOrders(@CurrentUser() user: any) {
    switch (user.role) {
      case UserRole.CUSTOMER:
        return this.orderService.getCustomerOrders(user.userId);
      case UserRole.SHOPKEEPER:
        return this.orderService.getStoreOrders(user.userId);
      case UserRole.RIDER:
        return this.orderService.getRiderOrders(user.userId);
      case UserRole.ADMIN:
        return this.orderService.getAllOrders();
      default:
        return [];
    }
  }

  @Get('available-riders')
  @Roles(UserRole.SHOPKEEPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get available riders for assignment' })
  @ApiResponse({ status: 200 })
  async getAvailableRiders() {
    return this.orderService.getAvailableRiders();
  }

  @Get(':orderId')
  @Roles(UserRole.CUSTOMER, UserRole.SHOPKEEPER, UserRole.RIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrderById(@CurrentUser() user: any, @Param('orderId') orderId: string) {
    return this.orderService.getOrderById(orderId, user.userId, user.role);
  }

  @Put(':orderId/status')
  @Roles(UserRole.CUSTOMER, UserRole.SHOPKEEPER, UserRole.RIDER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async updateOrderStatus(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(
      orderId,
      user.userId,
      user.role,
      updateOrderStatusDto,
    );
  }

  @Put(':orderId/assign-rider')
  @Roles(UserRole.SHOPKEEPER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Manually assign rider to order' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async assignRider(
    @CurrentUser() user: any,
    @Param('orderId') orderId: string,
    @Body() assignRiderDto: AssignRiderDto,
  ) {
    return this.orderService.assignRider(
      orderId,
      user.userId,
      user.role,
      assignRiderDto,
    );
  }
}