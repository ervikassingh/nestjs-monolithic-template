import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { S3Service } from './s3.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('/upload-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
    @Req() req: Request & { user: any },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.userId;
    const uploadedFile = await this.s3Service.uploadFile(
      file,
      userId,
      uploadFileDto,
    );

    return {
      success: true,
      data: uploadedFile,
      message: 'File uploaded successfully',
    };
  }

  @Get('/files')
  @UseGuards(JwtAuthGuard)
  async getUserFiles(@Req() req: Request & { user: any }) {
    const userId = req.user.userId;
    const files = await this.s3Service.getUserFiles(userId);

    return {
      success: true,
      data: files,
      message: 'Files retrieved successfully',
    };
  }

  @Delete('/files/:fileId')
  @UseGuards(JwtAuthGuard)
  async deleteFile(
    @Param('fileId') fileId: string,
    @Req() req: Request & { user: any },
  ) {
    const userId = req.user.userId;
    await this.s3Service.deleteFile(fileId, userId);

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }
} 