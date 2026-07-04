import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
// Le MediaModule sera essentiel pour le fonctionnement complet du contrôleur
import { MediaModule } from '../media/media.module'; 

@Module({
  imports: [MediaModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}