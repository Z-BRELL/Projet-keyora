import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
// Assurez-vous que ces enums existent dans vos fichiers communs, ou utilisez des strings
import { ListingStatus, Role } from '@prisma/client'; 

export enum ListingType { SALE = 'SALE', RENT = 'RENT' }
export enum PropertyType { APARTMENT = 'APARTMENT', HOUSE = 'HOUSE', LAND = 'LAND', COMMERCIAL = 'COMMERCIAL' }

export class CreateListingDto {
  @ApiProperty({ example: 'Villa moderne avec piscine à Bastos' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Description détaillée du bien...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ListingType })
  @IsEnum(ListingType)
  type: ListingType;

  @ApiProperty({ enum: PropertyType, required: false })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiProperty({ example: 180000000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 350, description: 'Surface en m²', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  area?: number;

  @ApiProperty({ example: 6, description: 'Nombre total de pièces', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  rooms?: number;

  @ApiProperty({ example: 3, description: 'Nombre de chambres', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bedrooms?: number;

  @ApiProperty({ example: 1, description: 'Nombre de salons/séjours', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  livingRoom?: number;

  @ApiProperty({ example: 1, description: 'Nombre de cuisines', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  kitchen?: number;

  @ApiProperty({ example: 2, description: 'Nombre de salles de bain', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bathrooms?: number;

  @ApiProperty({ example: 'Yaoundé' })
  @IsString()
  @IsNotEmpty()
  city: string;

  // FIX #4: Add missing address field
  @ApiProperty({ example: 'Rue de la Paix, Quartier Bastos', description: 'Complete street address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 3.8667, description: 'Latitude GPS', required: false })
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 11.5167, description: 'Longitude GPS', required: false })
  @IsLongitude()
  @IsOptional()
  longitude?: number;
}

export class UpdateListingDto extends PartialType(CreateListingDto) {}

export class ListingQueryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false, enum: ListingType })
  @IsEnum(ListingType)
  @IsOptional()
  type?: ListingType;

  @ApiProperty({ required: false, enum: PropertyType })
  @IsEnum(PropertyType)
  @IsOptional()
  propertyType?: PropertyType;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minArea?: number;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Max(50)
  limit?: number = 12;

  @ApiProperty({ required: false, description: 'Recherche par mot-clé (titre, ville, adresse)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Filtrer par propriétaire' })
  @IsString()
  @IsOptional()
  ownerId?: string;
}
