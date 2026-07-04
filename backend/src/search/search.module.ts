import { Controller, Post, Get, Body, Query, Module } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SearchService } from './search.service';

class PolygonSearchBodyDto {
  @ApiProperty({
    description: 'Tableau de coordonnées [lng, lat] formant le polygone',
    example: [[11.5, 3.8], [11.6, 3.8], [11.6, 3.9], [11.5, 3.9]],
  })
  @IsArray()
  polygon: number[][];

  @ApiProperty({ required: false }) @IsOptional() type?: string;
  @ApiProperty({ required: false }) @IsOptional() propertyType?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() minPrice?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() maxPrice?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() minArea?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() page?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() limit?: number;
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Post('polygon')
  @ApiOperation({ summary: 'Recherche par polygone dessiné sur la carte (PostGIS ST_Within)' })
  searchByPolygon(@Body() dto: PolygonSearchBodyDto) {
    return this.searchService.searchByPolygon(dto);
  }

  @Get('radius')
  @ApiOperation({ summary: 'Recherche par rayon autour d\'un point GPS (PostGIS ST_DWithin)' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radiusKm', type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  searchByRadius(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radiusKm') radiusKm: number,
    @Query('type') type?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.searchService.searchByRadius({
      lat: +lat, lng: +lng, radiusKm: +radiusKm, type, minPrice, maxPrice,
    });
  }

  @Get('cities')
  @ApiOperation({ summary: 'Autocomplétion des villes' })
  @ApiQuery({ name: 'q', description: 'Début du nom de ville' })
  getCities(@Query('q') q: string) {
    return this.searchService.getCitySuggestions(q || '');
  }
}

@Module({
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
