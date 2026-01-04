import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEmail, Min } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Quick Mart Downtown' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Shop 12, Main Boulevard, Karachi' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 24.8607 })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 67.0011 })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 5.5, description: 'Delivery radius in kilometers' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  deliveryRadius: number;

  @ApiProperty({ example: '+923001234567', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: 'shopkeeper@example.com' })
  @IsNotEmpty()
  @IsEmail()
  shopkeeperEmail: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  shopkeeperName: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty()
  @IsString()
  shopkeeperPassword: string;
}

export class UpdateStoreDto {
  @ApiProperty({ example: 'Quick Mart Downtown', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Shop 12, Main Boulevard, Karachi', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 24.8607, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 67.0011, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 5.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryRadius?: number;

  @ApiProperty({ example: '+923001234567', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class StoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  deliveryRadius: number;

  @ApiProperty()
  phoneNumber?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  shopkeeper: {
    id: string;
    email: string;
    fullName: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}