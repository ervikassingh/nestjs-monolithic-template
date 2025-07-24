import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDate,
  IsPositive,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Price of the order',
    example: 99.99,
    required: true,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Total price must be a positive number' })
  @IsNotEmpty()
  totalPrice: number;

  @ApiProperty({
    description: 'Status of the order',
    example: OrderStatus.pending,
    enum: OrderStatus,
    required: false,
  })
  @IsEnum(OrderStatus, {
    message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
  })
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    description: ' Customer name',
    example: 'John Doe',
    required: false,
  })
  @IsString({ message: 'Customer name must be a string' })
  customerName?: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'example@example.com',
    required: false,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  customerEmail?: string;

  @ApiProperty({
    description: 'Shipping address for the order',
    example: '123 Main St, Springfield, USA',
    required: false,
  })
  @IsString({ message: 'Shipping address must be a string' })
  shippingAddress?: string;

  @ApiProperty({
    description: 'Billing address for the order',
    example: '456 Elm St, Springfield, USA',
    required: false,
  })
  @IsString({ message: 'Billing address must be a string' })
  billingAddress?: string;

  @ApiProperty({
    description: 'Indicates if the order is paid',
    example: true,
    required: false,
  })
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({
    description: 'Date when the order was paid',
    example: '2023-10-01T12:00:00Z',
    type: Date,
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  paidAt?: Date;
}

export class CreateOrderResponseDto extends CreateOrderDto {
  @ApiProperty({
    description: 'Unique identifier for the order',
    example: '1234567890abcdef12345678',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  _id: string;
}
