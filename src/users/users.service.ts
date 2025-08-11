import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from '../common/schemas/user.schema';

import * as bcrypt from 'bcrypt';
import { ImageProcessingService } from '../image-processing/image-processing.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly s3Service: S3Service,
  ) {}
  
  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  findAll(role?: string): Promise<UserDocument[]> {
    if (role) {
      return this.userModel.find({ role }).exec();
    }
    return this.userModel.find().exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).exec();
  }

  update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, {
        new: true,
        runValidators: true,
      })
      .exec();
  }

  remove(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; profileImages: any }> {
    if (!file) throw new BadRequestException('No file uploaded');
    
    // Process images in memory
    const processedImages = await this.imageProcessingService.resizeAndProcess(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    // Upload all processed images to S3
    const s3Results = await Promise.all(
      processedImages.map(async (image) => {
        return await this.s3Service.uploadBuffer(
          image.buffer,
          image.name,
          image.mimetype,
          'profile-images',
        );
      })
    );

    // Create profile images object with S3 URLs
    const profileImages = {
      thumbnail: s3Results[0].url,
      medium: s3Results[1].url,
      original: s3Results[2].url,
    };

    // Update user profile with S3 URLs
    return this.updateProfileImage(userId, profileImages);
  }

  async updateProfileImage(userId: string, profileImages: { thumbnail: string; medium: string; original: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    user.set('profileImages', profileImages);
    await user.save();
    
    return { message: 'Profile image updated', profileImages: user.profileImages };
  }
}
