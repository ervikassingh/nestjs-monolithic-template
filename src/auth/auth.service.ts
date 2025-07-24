import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (
      user &&
      (await bcrypt.compare(loginDto.password, user.password))
    ) {
      return await this.usersService.findOne(user.id.toString());
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const validUser = await this.validateUser(loginDto);
    if (!validUser) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      sub: validUser._id,
      email: validUser.email,
      role: validUser.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    return this.usersService.create(createUserDto);
  }
}
