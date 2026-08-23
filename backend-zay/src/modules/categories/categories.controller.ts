import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

const imageUpload = FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  /**
   * multipart/form-data :
   * - name (texte)
   * - image (fichier, optionnel)
   */
  @Post()
  @AdminOnly()
  @UseInterceptors(imageUpload)
  create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.create(dto, image);
  }

  /**
   * multipart/form-data :
   * - name? (texte)
   * - image? (fichier — remplace l’ancienne image)
   */
  @Patch(':id')
  @AdminOnly()
  @UseInterceptors(imageUpload)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, dto, image);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }

  @Get(':id/subcategories')
  findSubcategories(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findSubcategories(id);
  }

  @Post(':id/subcategories')
  @AdminOnly()
  @UseInterceptors(imageUpload)
  createSubcategory(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateSubcategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.createSubcategory(id, dto, image);
  }

  @Patch(':categoryId/subcategories/:subId')
  @AdminOnly()
  @UseInterceptors(imageUpload)
  updateSubcategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
    @Body() dto: UpdateSubcategoryDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.categoriesService.updateSubcategory(
      categoryId,
      subId,
      dto,
      image,
    );
  }

  @Delete(':categoryId/subcategories/:subId')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  removeSubcategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('subId', ParseUUIDPipe) subId: string,
  ) {
    return this.categoriesService.removeSubcategory(categoryId, subId);
  }
}
