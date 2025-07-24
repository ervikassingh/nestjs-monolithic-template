import {
  Body,
  Controller,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

import { BasicAuthGuard } from './guards/basic-auth.guard';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'User login',
    description: 'This endpoint allows users to log in with their credentials.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Returns a JWT token.',
    type: String,
  })
  @Post('login')
  @HttpCode(200)
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @ApiOperation({
    summary: 'User registration',
    description: 'This endpoint allows users to register a new account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful. Returns the created user object.',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Invalid input data.',
  })
  @Post('register')
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
}
