import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UploadsService } from '../../common/uploads/uploads.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    const cacheKey = this.redis.catalogCategoriesKey();
    const cached = await this.redis.getJson<unknown[]>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    });
    await this.redis.setJson(cacheKey, categories);
    return categories;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto, imageFile?: Express.Multer.File) {
    const name = dto.name.trim().toUpperCase();
    const image = imageFile
      ? this.uploads.saveImage(imageFile, 'categories')
      : null;

    try {
      const created = await this.prisma.category.create({
        data: { name, image },
      });
      await this.redis.invalidateCatalog();
      return created;
    } catch (error) {
      if (image) this.uploads.deleteIfOwned(image);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Category "${name}" already exists`);
      }
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    imageFile?: Express.Multer.File,
  ) {
    const existing = await this.findOne(id);

    const data: Prisma.CategoryUpdateInput = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim().toUpperCase();
    }

    let newImage: string | undefined;
    if (imageFile) {
      newImage = this.uploads.saveImage(imageFile, 'categories');
      data.image = newImage;
    }

    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data,
        include: {
          subcategories: { orderBy: { name: 'asc' } },
        },
      });

      if (newImage && existing.image) {
        this.uploads.deleteIfOwned(existing.image);
      }

      await this.redis.invalidateCatalog();
      return updated;
    } catch (error) {
      if (newImage) this.uploads.deleteIfOwned(newImage);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    this.uploads.deleteIfOwned(existing.image);
    await this.redis.invalidateCatalog();
  }

  async findSubcategories(categoryId: string) {
    await this.findOne(categoryId);
    const cacheKey = this.redis.catalogSubcategoriesKey(categoryId);
    const cached = await this.redis.getJson<unknown[]>(cacheKey);
    if (cached) return cached;

    const rows = await this.prisma.subcategory.findMany({
      where: { categoryId },
      orderBy: { name: 'asc' },
    });
    await this.redis.setJson(cacheKey, rows);
    return rows;
  }

  async createSubcategory(
    categoryId: string,
    dto: CreateSubcategoryDto,
    imageFile?: Express.Multer.File,
  ) {
    await this.findOne(categoryId);
    const name = dto.name.trim();
    const image = imageFile
      ? this.uploads.saveImage(imageFile, 'subcategories')
      : null;

    try {
      const created = await this.prisma.subcategory.create({
        data: {
          name,
          categoryId,
          image,
        },
      });
      await this.redis.invalidateCatalog();
      return created;
    } catch (error) {
      if (image) this.uploads.deleteIfOwned(image);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Subcategory "${name}" already exists in this category`,
        );
      }
      throw error;
    }
  }

  async updateSubcategory(
    categoryId: string,
    subId: string,
    dto: UpdateSubcategoryDto,
    imageFile?: Express.Multer.File,
  ) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subId, categoryId },
    });

    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory ${subId} not found in category ${categoryId}`,
      );
    }

    const data: Prisma.SubcategoryUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();

    let newImage: string | undefined;
    if (imageFile) {
      newImage = this.uploads.saveImage(imageFile, 'subcategories');
      data.image = newImage;
    }

    try {
      const updated = await this.prisma.subcategory.update({
        where: { id: subId },
        data,
      });

      if (newImage && subcategory.image) {
        this.uploads.deleteIfOwned(subcategory.image);
      }

      await this.redis.invalidateCatalog();
      return updated;
    } catch (error) {
      if (newImage) this.uploads.deleteIfOwned(newImage);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Subcategory name already exists in this category',
        );
      }
      throw error;
    }
  }

  async removeSubcategory(categoryId: string, subId: string) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subId, categoryId },
    });

    if (!subcategory) {
      throw new NotFoundException(
        `Subcategory ${subId} not found in category ${categoryId}`,
      );
    }

    await this.prisma.subcategory.delete({ where: { id: subId } });
    this.uploads.deleteIfOwned(subcategory.image);
    await this.redis.invalidateCatalog();
  }
}
