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
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminOnly } from '../auth/decorators/admin-only.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-variant.dto';
import { ProductsService } from './products.service';

const productImagesUpload = FileFieldsInterceptor(
  [
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 8 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  },
);

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.productsService.findOne(idOrSlug);
  }

  /**
   * JSON ou multipart :
   * - image (couverture, fichier)
   * - gallery (fichiers additionnels)
   * - images (JSON string des URLs galerie à conserver)
   */
  @Post()
  @AdminOnly()
  @UseInterceptors(productImagesUpload)
  create(
    @Body() dto: CreateProductDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.productsService.create(
      dto,
      files?.image?.[0],
      files?.gallery ?? [],
    );
  }

  @Patch(':id')
  @AdminOnly()
  @UseInterceptors(productImagesUpload)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles()
    files?: {
      image?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
  ) {
    return this.productsService.update(
      id,
      dto,
      files?.image?.[0],
      files?.gallery ?? [],
    );
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/variants')
  @AdminOnly()
  addVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductVariantDto,
  ) {
    return this.productsService.addVariant(id, dto);
  }

  @Patch(':id/variants/:variantId')
  @AdminOnly()
  updateVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(id, variantId, dto);
  }

  @Delete(':id/variants/:variantId')
  @AdminOnly()
  removeVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
  ) {
    return this.productsService.removeVariant(id, variantId);
  }
}
