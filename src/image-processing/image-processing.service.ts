import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';

export interface ProcessedImage {
  name: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class ImageProcessingService {
  async resizeAndProcess(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<ProcessedImage[]> {
    const ext = fileName.split('.').pop();
    const name = fileName.replace(`.${ext}`, '');

    const sizes = [
      { name: 'thumbnail', width: 100 },
      { name: 'medium', width: 500 },
    ];

    const processedImages: ProcessedImage[] = [];
    
    // Process thumbnail
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize({ width: 100 })
      .toBuffer();
    
    processedImages.push({
      name: `${name}-thumbnail.${ext}`,
      buffer: thumbnailBuffer,
      mimetype,
    });

    // Process medium
    const mediumBuffer = await sharp(fileBuffer)
      .resize({ width: 500 })
      .toBuffer();
    
    processedImages.push({
      name: `${name}-medium.${ext}`,
      buffer: mediumBuffer,
      mimetype,
    });

    // Add original
    processedImages.push({
      name: fileName,
      buffer: fileBuffer,
      mimetype,
    });

    return processedImages;
  }
}
