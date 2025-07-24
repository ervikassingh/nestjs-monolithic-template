import { Module } from '@nestjs/common';
import { ImageProcessingService } from './image-processing.service';

@Module({
  providers: [ImageProcessingService],
  exports: [ImageProcessingService]
})
export class ImageProcessingModule {}
