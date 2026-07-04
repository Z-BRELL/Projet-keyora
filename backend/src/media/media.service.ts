import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadListingPhotos(
    listingId: string,
    files: Express.Multer.File[],
    userId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing || listing.ownerId !== userId) {
      throw new BadRequestException('Annonce introuvable ou non autorisé');
    }

    const uploads = await Promise.all(
      files.map((file, index) =>
        this.uploadBuffer(file.buffer, `keyora/listings/${listingId}`, index),
      ),
    );

    const photos = await Promise.all(
      uploads.map((result, index) =>
        this.prisma.listingPhoto.create({
          data: {
            listingId,
            url: result.secure_url,
            storageKey: result.public_id,
            position: index,
          },
        }),
      ),
    );

    return { message: `${photos.length} photo(s) uploadée(s)`, photos };
  }

  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.prisma.listingPhoto.findUnique({
      where: { id: photoId },
      include: { listing: true },
    });
    if (!photo) throw new BadRequestException('Photo introuvable');
    if (photo.listing.ownerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    await cloudinary.uploader.destroy(photo.storageKey);
    await this.prisma.listingPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo supprimée' };
  }

  private uploadBuffer(
    buffer: Buffer,
    folder: string,
    index: number,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            { width: 1280, height: 960, crop: 'limit', quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      stream.end(buffer);
    });
  }
}
