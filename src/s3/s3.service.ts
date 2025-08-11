import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import { File, FileDocument } from '../common/schemas/file.schema';

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresIn: number;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(File.name) private readonly fileModel: Model<FileDocument>,
  ) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');
    if (!bucketName) throw new Error('AWS_S3_BUCKET_NAME is required');
    this.bucketName = bucketName;

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required');
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: any,
    userId: string,
    uploadFileDto: any,
  ): Promise<FileDocument> {
    try {
      // Upload file to S3
      const s3Result = await this.uploadFileToS3(
        file,
        uploadFileDto.folder || 'uploads',
      );

      // Save file metadata to database
      const fileDocument = new this.fileModel({
        originalName: file.originalname,
        fileName: file.originalname,
        fileKey: s3Result.key,
        fileUrl: s3Result.url,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: new Types.ObjectId(userId),
        folder: uploadFileDto.folder,
        description: uploadFileDto.description,
        isActive: true,
      });

      const savedFile = await fileDocument.save();

      return savedFile;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async getUserFiles(userId: string): Promise<FileDocument[]> {
    return await this.fileModel
      .find({ uploadedBy: new Types.ObjectId(userId), isActive: true })
      .sort({ createdAt: -1 });
  }

  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileModel.findOne({
      _id: fileId,
      uploadedBy: new Types.ObjectId(userId),
      isActive: true,
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from S3
    await this.deleteFileFromS3(file.fileKey);

    // Mark as inactive in database
    await this.fileModel.findByIdAndUpdate(fileId, { isActive: false });
  }

  async getPresignedUrl(
    key: string,
    operation: 'get' | 'put' = 'get',
    expiresIn: number = 3600,
  ): Promise<PresignedUrlResult> {
    try {
      let command;
      
      if (operation === 'put') {
        command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
      } else {
        command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });
      }

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return {
        url,
        key,
        expiresIn,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${error.message}`);
      throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
  }

  private generateKey(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4();
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const key = `${folder ? `${folder}/` : ''}${timestamp}-${sanitizedName}-${randomId}.${extension}`;
    
    return key;
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimetype: string,
    folder?: string,
    customKey?: string,
  ): Promise<UploadResult> {
    try {
      const key = customKey || this.generateKey(fileName, folder);
      const contentType = mimetype;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`Buffer uploaded successfully: ${key}`);

      return {
        key,
        url,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload buffer: ${error.message}`);
      throw new Error(`Failed to upload buffer: ${error.message}`);
    }
  }

  private async uploadFileToS3(
    file: Express.Multer.File,
    folder?: string,
    customKey?: string,
  ): Promise<UploadResult> {
    try {
      const key = customKey || this.generateKey(file.originalname, folder);
      const contentType = file.mimetype;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  private async deleteFileFromS3(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
} 