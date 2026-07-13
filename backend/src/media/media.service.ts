import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

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

    const existingCount = await this.prisma.listingPhoto.count({
      where: { listingId },
    });

    const photos = await this.attachPhotos(listingId, files, existingCount);
    return { message: `${photos.length} photo(s) uploadée(s)`, photos };
  }

  /** Upload une liste de fichiers vers S3 et crée les ListingPhoto associées. */
  async attachPhotos(
    listingId: string,
    files: Express.Multer.File[],
    startPosition = 0,
  ) {
    const uploads = await Promise.all(
      files.map((file) =>
        this.s3.uploadFile(
          file.buffer,
          file.mimetype,
          file.originalname,
          `listings/${listingId}`,
        ),
      ),
    );

    return Promise.all(
      uploads.map((result, index) =>
        this.prisma.listingPhoto.create({
          data: {
            listingId,
            url: result.url,
            storageKey: result.key,
            position: startPosition + index,
          },
        }),
      ),
    );
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

    if (photo.storageKey) {
      await this.s3.deleteFile(photo.storageKey);
    }
    await this.prisma.listingPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo supprimée' };
  }
}
