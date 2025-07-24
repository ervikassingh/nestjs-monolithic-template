import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../common/enums/roles.enum';

export class AddressDto {
  @ApiProperty({
    description: 'Street address of the user',
    example: '123 Main St',
    required: false,
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'City of the user',
    example: 'Springfield',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    description: 'State of the user',
    example: 'IL',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'ZIP code of the user',
    example: '62704',
    required: false,
  })
  @IsOptional()
  @Matches(/^\d{5}(-\d{4})?$/, { message: 'Invalid ZIP code' })
  zip?: string;

  @ApiProperty({
    description: 'Country of the user',
    example: 'USA',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'example@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'strongpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Role of the user',
    example: Role.user,
    enum: Role,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, {
    message: `Role must be one of: ${Object.values(Role).join(', ')}`,
  })
  @IsString()
  role?: Role;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?\d{10,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({
    description: 'Address of the user',
    type: AddressDto,
    required: false,
  })
  @IsOptional()
  address?: AddressDto;

  @ApiProperty({
    description: 'Indicates if the user is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateUserResponseDto extends CreateUserDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '60c72b2f9b1e8d3f4c8b4567',
  })
  @IsString()
  @IsNotEmpty()
  _id: string;
}
