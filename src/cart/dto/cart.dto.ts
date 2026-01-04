import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

// Declare CartItemResponseDto BEFORE CartResponseDto
export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  };

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  subtotal: number;
}

// Now CartResponseDto can reference CartItemResponseDto
export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customer: {
    id: string;
    email: string;
    fullName: string;
  };

  @ApiProperty({ nullable: true })
  store: {
    id: string;
    name: string;
    address: string;
  } | null;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}