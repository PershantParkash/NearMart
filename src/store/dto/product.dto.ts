import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Fresh Milk 1L' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Fresh farm milk, full cream', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 250.50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'Dairy', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'MILK-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;
}

export class UpdateProductDto {
  @ApiProperty({ example: 'Fresh Milk 1L', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Fresh farm milk, full cream', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 250.50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 'Dairy', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 'MILK-001', required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  imageUrl?: string;

  @ApiProperty()
  category?: string;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  store: {
    id: string;
    name: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}