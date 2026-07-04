import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Module,
} from '@nestjs/common';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsString, IsNotEmpty, IsOptional, IsArray, IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';

class CreatePostDto {
  @ApiProperty() @IsString() @IsNotEmpty() title: string;
  @ApiProperty() @IsString() @IsNotEmpty() content: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() excerpt?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() coverUrl?: string;
  @ApiProperty({ required: false, type: [String] }) @IsArray() @IsOptional() categoryIds?: string[];
  @ApiProperty({ required: false, enum: ['DRAFT', 'PUBLISHED'] })
  @IsEnum(['DRAFT', 'PUBLISHED']) @IsOptional() status?: 'DRAFT' | 'PUBLISHED';
}

@Injectable()
class BlogService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 9, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = status ? { status } : {};
    const [data, total] = await this.prisma.$transaction([
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, fullName: true, avatarUrl: true } },
          categories: { include: { category: true } },
        },
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true } },
        categories: { include: { category: true } },
      },
    });
    if (!post) throw new NotFoundException('Article introuvable');
    return post;
  }

  async create(dto: CreatePostDto, authorId: string) {
    let slug = slugify(dto.title, { lower: true, strict: true });
    // Éviter les slugs dupliqués
    const exists = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now()}`;

    return this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        excerpt: dto.excerpt,
        coverUrl: dto.coverUrl,
        authorId,
        status: dto.status || 'DRAFT',
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
        categories: dto.categoryIds
          ? { create: dto.categoryIds.map((id) => ({ categoryId: id })) }
          : undefined,
      },
      include: { categories: { include: { category: true } } },
    });
  }

  async update(id: string, dto: Partial<CreatePostDto>) {
    const data: any = { ...dto };
    if (dto.title) {
      data.slug = slugify(dto.title, { lower: true, strict: true });
    }
    if (dto.status === 'PUBLISHED') data.publishedAt = new Date();
    if (dto.categoryIds) delete data.categoryIds;

    return this.prisma.blogPost.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: 'Article supprimé' };
  }

  async getCategories() {
    return this.prisma.blogCategory.findMany({ orderBy: { name: 'asc' } });
  }
}

@ApiTags('blog')
@Controller('blog')
class BlogController {
  constructor(private blogService: BlogService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister tous les articles (SuperAdmin)' })
  adminGetAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
  ) {
    return this.blogService.findAll(+page, +limit, status || undefined);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Liste des catégories' })
  getCategories() {
    return this.blogService.getCategories();
  }

  @Get('posts')
  @ApiOperation({ summary: 'Liste des articles publiés' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 9,
  ) {
    return this.blogService.findAll(+page, +limit, 'PUBLISHED');
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Détail d\'un article par son slug' })
  findOne(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un article (SuperAdmin)' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
    return this.blogService.create(dto, user.id);
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un article (SuperAdmin)' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePostDto>) {
    return this.blogService.update(id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un article (SuperAdmin)' })
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}

@Module({
  controllers: [BlogController],
  providers: [BlogService],
})
export class BlogModule {}
