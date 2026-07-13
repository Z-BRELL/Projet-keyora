import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Seuls les formats JPG, PNG et WebP sont acceptés'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  ],
  providers: [MediaService, S3Service],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
