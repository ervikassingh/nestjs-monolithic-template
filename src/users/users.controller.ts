import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';

import { UsersService } from './users.service';

import { BasicAuthGuard } from '../auth/guards/basic-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

import { CreateUserDto, CreateUserResponseDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, File } from 'multer';
import { extname } from 'path';

import { ImageProcessingService } from '../image-processing/image-processing.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly imageProcessingService: ImageProcessingService,
  ) {}

  @ApiOperation({
    summary: 'Create a new user',
    description:
      'This endpoint allows you to create a new user with the provided details.',
  })
  @ApiBody({
    description: 'User details to create a new user',
    type: CreateUserDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
    type: CreateUserResponseDto,
  })
  @Post()
  @ApiSecurity('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  async create(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    return await this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Get all users',
    description:
      'This endpoint retrieves all users. You can filter by role using the query parameter "role".',
  })
  @ApiQuery({
    name: 'role',
    description: 'Filter users by role (optional)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of users retrieved successfully.',
    type: [CreateUserResponseDto],
  })
  @Get()
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'This endpoint retrieves a user by their unique ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the user',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully.',
    type: CreateUserResponseDto,
  })
  @Get(':id')
  @ApiSecurity('basic')
  @UseGuards(BasicAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user by ID',
    description:
      "This endpoint allows you to update a user's details using their unique ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the user to update',
    type: String,
  })
  @ApiBody({
    description: 'User details to update',
    type: UpdateUserDto,
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully.',
    type: CreateUserResponseDto,
  })
  @Patch(':id')
  @ApiSecurity('bearer')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    const existingUser = this.usersService.findOne(id);
    if (!existingUser) {
      throw new UnauthorizedException('User does not exists');
    }
    const user = req.user;
    const isOwner = user.userId === id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete a user by ID',
    description:
      'This endpoint allows you to delete a user using their unique ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the user to delete',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully.',
    type: CreateUserResponseDto,
  })
  @Delete(':id')
  @ApiSecurity('bearer')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    const user = req.user;
    const isOwner = user.userId === id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to delete this user');
    }

    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the user',
    type: String,
  })
  @ApiBody({
    description: 'Profile image file to upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image uploaded successfully' })
  @Post(':id/profile-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB limit
      },
    }),
  )
  async uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const resizedImages = await this.imageProcessingService.resizeAndSave(
      file.path,
      file.filename,
    );
    return this.usersService.updateProfileImage(id, resizedImages);
  }
}
