import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { ListingsService } from './listings.service';
// Le MediaService sera créé juste après pour Cloudinary
import { MediaService } from '../media/media.service'; 
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
} from './dto/listing.dto';
import { JwtAuthGuard, RolesGuard, OptionalJwtAuthGuard } from '../common/guards';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(
    private listingsService: ListingsService,
    private mediaService: MediaService,
  ) {}

  @Get('admin/all-listings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les annonces (SuperAdmin)' })
  getAllListingsForAdmin(
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.listingsService.getAllListingsForAdmin(status, +page, +limit);
  }

  @Get('admin/user-listings/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toutes les annonces d\'un utilisateur (Admin/Moderator)' })
  getUserListingsForAdmin(@Param('userId') userId: string) {
    return this.listingsService.getMyListings(userId);
  }

  @Delete('admin/bulk-delete/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer toutes les annonces d\'un utilisateur (SuperAdmin)' })
  bulkDeleteUserListings(@Param('userId') userId: string) {
    return this.listingsService.bulkDeleteUserListings(userId);
  }

  @Get('user/favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes annonces favorites' })
  getFavorites(@CurrentUser() user: any) {
    return this.listingsService.getUserFavorites(user.id);
  }

  @Get('user/my-listings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes annonces (propriétaire/agent)' })
  getMyListings(@CurrentUser() user: any) {
    return this.listingsService.getMyListings(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Catalogue des annonces publiées (paginé, filtrable)' })
  findAll(@Query() query: ListingQueryDto) {
    return this.listingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Détail d\'une annonce' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.findOne(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER, Role.SUPERADMIN)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Créer une annonce (statut DRAFT), avec upload optionnel de photos (max 10)' })
  @ApiResponse({ status: 201, description: 'Annonce créée en brouillon' })
  create(
    @Body() dto: CreateListingDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    return this.listingsService.create(dto, user.id, files);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soumettre une annonce en modération (DRAFT → PENDING)' })
  submit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.submit(id, user.id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('photos', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader des photos pour une annonce (max 10)' })
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    return this.mediaService.uploadListingPhotos(id, files, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier une annonce' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @CurrentUser() user: any,
  ) {
    return this.listingsService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une annonce' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.remove(id, user.id, user.role);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter/retirer des favoris (toggle)' })
  toggleFavorite(@Param('id') id: string, @CurrentUser() user: any) {
    return this.listingsService.toggleFavorite(id, user.id);
  }
}
