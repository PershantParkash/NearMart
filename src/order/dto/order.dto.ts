import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { OrderStatus } from '../../entities/order.entity';

export class CreateOrderDto {
  @ApiProperty({ example: '123 Main Street, Karachi' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @ApiProperty({ example: 24.8607 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  deliveryLatitude: number;

  @ApiProperty({ example: 67.0011 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  deliveryLongitude: number;

  @ApiProperty({ example: '+923001234567' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ example: 'Ring the doorbell twice', required: false })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class AssignRiderDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  riderId: string;
}

export class OrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  customer: {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string;
  };

  @ApiProperty()
  store: {
    id: string;
    name: string;
    address: string;
    phoneNumber: string;
  };

  @ApiProperty({ nullable: true })
  rider: {
    id: string;
    fullName: string;
    phoneNumber: string;
  } | null;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  deliveryFee: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  deliveryAddress: string;

  @ApiProperty()
  deliveryLatitude: number;

  @ApiProperty()
  deliveryLongitude: number;

  @ApiProperty()
  customerPhone: string;

  @ApiProperty({ nullable: true })
  specialInstructions: string;

  @ApiProperty()
  isRiderAutoAssigned: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}