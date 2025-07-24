import { Injectable } from '@nestjs/common';

import * as sharp from 'sharp';
import { join } from 'path';
// import * as fs from 'fs';

@Injectable()
export class ImageProcessingService {
  async resizeAndSave(filePath: string, fileName: string): Promise<string[]> {
    const ext = fileName.split('.').pop();
    const name = fileName.replace(`.${ext}`, '');

    const sizes = [
      { name: 'thumbnail', width: 100 },
      { name: 'medium', width: 500 },
    ];

    const outputPaths: string[] = [];
    for (const size of sizes) {
      const outputName = `${name}-${size.name}.${ext}`;
      const outputPath = join('uploads/profile-images', outputName);
      await sharp(filePath).resize({ width: size.width }).toFile(outputPath);
      outputPaths.push(outputPath);
    }
    outputPaths.push(filePath);

    // fs.unlinkSync(filePath); // Optionally delete the original file after processing
    
    return outputPaths;
  }
}
