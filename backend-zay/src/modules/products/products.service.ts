import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsService } from '../../common/uploads/uploads.service';
import {
  CreateProductDto,
  CreateProductVariantDto,
} from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-variant.dto';
import { computeProductStatus, slugify } from './product.helpers';

const productInclude = {
  category: true,
  subcategory: true,
  variants: {
    orderBy: [{ size: 'asc' as const }, { colorName: 'asc' as const }],
  },
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  findAll(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.subcategoryId) where.subcategoryId = query.subcategoryId;
    if (typeof query.isNew === 'boolean') where.isNew = query.isNew;
    if (typeof query.isPromo === 'boolean') where.isPromo = query.isPromo;
    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { slug: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: productInclude,
    });
  }

  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const product = await this.prisma.product.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException(`Product "${idOrSlug}" not found`);
    }

    return product;
  }

  async create(
    dto: CreateProductDto,
    imageFile?: Express.Multer.File,
    galleryFiles: Express.Multer.File[] = [],
  ) {
    await this.ensureCategory(dto.categoryId);
    if (dto.subcategoryId) {
      await this.ensureSubcategory(dto.subcategoryId, dto.categoryId);
    }

    const image = imageFile
      ? this.uploads.saveImage(imageFile, 'products')
      : dto.image?.trim();

    if (!image) {
      throw new BadRequestException(
        'Image produit requise (fichier ou URL/chemin)',
      );
    }

    const gallerySaved = galleryFiles.map((f) =>
      this.uploads.saveImage(f, 'products'),
    );
    const images = [
      ...(dto.images ?? []).map((u) => u.trim()).filter(Boolean),
      ...gallerySaved,
    ].filter((u) => u !== image);

    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || slugify(dto.name));
    const variants = dto.variants ?? [];
    const stock =
      variants.length > 0
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : (dto.stock ?? 0);

    const isPromo =
      dto.isPromo ??
      (dto.originalPrice != null && dto.originalPrice > dto.price);

    try {
      return await this.prisma.product.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
          price: dto.price,
          originalPrice: dto.originalPrice,
          stock,
          status: computeProductStatus(stock),
          image,
          images,
          badge: dto.badge?.trim(),
          isNew: dto.isNew ?? true,
          isPromo,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          variants:
            variants.length > 0
              ? {
                  create: variants.map((v) => ({
                    size: v.size.trim().toUpperCase(),
                    colorName: v.colorName.trim(),
                    colorHex: v.colorHex?.trim(),
                    sku: v.sku?.trim(),
                    stock: v.stock,
                  })),
                }
              : undefined,
        },
        include: productInclude,
      });
    } catch (error) {
      if (imageFile) this.uploads.deleteIfOwned(image);
      for (const g of gallerySaved) this.uploads.deleteIfOwned(g);
      this.rethrowUnique(error);
    }
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    imageFile?: Express.Multer.File,
    galleryFiles: Express.Multer.File[] = [],
  ) {
    const existing = await this.findOne(id);

    if (dto.categoryId) {
      await this.ensureCategory(dto.categoryId);
    }

    const categoryId = dto.categoryId ?? existing.categoryId;
    const subcategoryId =
      dto.subcategoryId === undefined
        ? existing.subcategoryId
        : dto.subcategoryId;

    if (subcategoryId) {
      await this.ensureSubcategory(subcategoryId, categoryId);
    }

    let slug = existing.slug;
    if (dto.slug?.trim()) {
      slug = await this.ensureUniqueSlug(dto.slug.trim(), existing.id);
    } else if (dto.name?.trim() && dto.name.trim() !== existing.name) {
      slug = await this.ensureUniqueSlug(slugify(dto.name), existing.id);
    }

    const price = dto.price ?? Number(existing.price);
    const originalPrice =
      dto.originalPrice === undefined
        ? existing.originalPrice != null
          ? Number(existing.originalPrice)
          : null
        : dto.originalPrice;

    let newImage: string | undefined;
    if (imageFile) {
      newImage = this.uploads.saveImage(imageFile, 'products');
    }

    const gallerySaved = galleryFiles.map((f) =>
      this.uploads.saveImage(f, 'products'),
    );
    const nextImages =
      dto.images !== undefined
        ? [
            ...dto.images.map((u) => u.trim()).filter(Boolean),
            ...gallerySaved,
          ]
        : gallerySaved.length > 0
          ? [...(existing.images ?? []), ...gallerySaved]
          : undefined;

    const data: Prisma.ProductUpdateInput = {
      name: dto.name?.trim(),
      slug,
      description:
        dto.description === undefined ? undefined : dto.description.trim(),
      price: dto.price,
      // null = effacer le prix barré ; undefined = ne pas toucher
      originalPrice:
        dto.originalPrice === undefined ? undefined : dto.originalPrice,
      image: newImage ?? dto.image,
      images: nextImages,
      badge: dto.badge === undefined ? undefined : dto.badge.trim(),
      isNew: dto.isNew,
      isPromo:
        dto.isPromo ??
        (originalPrice != null && originalPrice > price),
      category: dto.categoryId
        ? { connect: { id: dto.categoryId } }
        : undefined,
      subcategory:
        subcategoryId === null || subcategoryId === undefined
          ? dto.subcategoryId === null
            ? { disconnect: true }
            : undefined
          : { connect: { id: subcategoryId } },
    };

    const replacingVariants = dto.variants !== undefined;

    if (
      typeof dto.stock === 'number' &&
      (!replacingVariants || dto.variants!.length === 0)
    ) {
      const variantCount = replacingVariants
        ? 0
        : await this.prisma.productVariant.count({
            where: { productId: existing.id },
          });
      if (variantCount === 0) {
        data.stock = dto.stock;
        data.status = computeProductStatus(dto.stock);
      }
    }

    try {
      await this.prisma.product.update({
        where: { id: existing.id },
        data,
      });

      if (newImage && existing.image) {
        this.uploads.deleteIfOwned(existing.image);
      }

      if (replacingVariants) {
        if (dto.variants!.length > 0) {
          return this.replaceVariants(existing.id, dto.variants!);
        }
        await this.prisma.productVariant.deleteMany({
          where: { productId: existing.id },
        });
      }

      return this.findOne(existing.id);
    } catch (error) {
      if (newImage) this.uploads.deleteIfOwned(newImage);
      this.rethrowUnique(error);
    }
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    this.uploads.deleteIfOwned(existing.image);
    await this.prisma.product.delete({ where: { id: existing.id } });
  }

  async addVariant(productId: string, dto: CreateProductVariantDto) {
    const product = await this.findOne(productId);

    try {
      await this.prisma.productVariant.create({
        data: {
          productId: product.id,
          size: dto.size.trim().toUpperCase(),
          colorName: dto.colorName.trim(),
          colorHex: dto.colorHex?.trim(),
          sku: dto.sku?.trim(),
          stock: dto.stock,
        },
      });
    } catch (error) {
      this.rethrowUnique(error);
    }

    return this.syncStockFromVariants(product.id);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    dto: UpdateProductVariantDto,
  ) {
    const product = await this.findOne(productId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId: product.id },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant ${variantId} not found on product ${productId}`,
      );
    }

    try {
      await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          size: dto.size !== undefined ? dto.size.trim().toUpperCase() : undefined,
          colorName:
            dto.colorName !== undefined ? dto.colorName.trim() : undefined,
          colorHex:
            dto.colorHex === undefined
              ? undefined
              : dto.colorHex === null
                ? null
                : dto.colorHex.trim(),
          sku:
            dto.sku === undefined
              ? undefined
              : dto.sku === null
                ? null
                : dto.sku.trim(),
          stock: dto.stock,
        },
      });
    } catch (error) {
      this.rethrowUnique(error);
    }

    return this.syncStockFromVariants(product.id);
  }

  async removeVariant(productId: string, variantId: string) {
    const product = await this.findOne(productId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId, productId: product.id },
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant ${variantId} not found on product ${productId}`,
      );
    }

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return this.syncStockFromVariants(product.id);
  }

  private async replaceVariants(
    productId: string,
    variants: CreateProductVariantDto[],
  ) {
    await this.prisma.$transaction([
      this.prisma.productVariant.deleteMany({ where: { productId } }),
      this.prisma.productVariant.createMany({
        data: variants.map((v) => ({
          productId,
          size: v.size.trim().toUpperCase(),
          colorName: v.colorName.trim(),
          colorHex: v.colorHex?.trim(),
          sku: v.sku?.trim(),
          stock: v.stock,
        })),
      }),
    ]);

    return this.syncStockFromVariants(productId);
  }

  private async syncStockFromVariants(productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
    });
    const stock = variants.reduce((sum, v) => sum + v.stock, 0);

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        stock,
        status: computeProductStatus(stock),
      },
      include: productInclude,
    });
  }

  private async ensureCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} does not exist`);
    }
    return category;
  }

  private async ensureSubcategory(subcategoryId: string, categoryId: string) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subcategoryId, categoryId },
    });
    if (!subcategory) {
      throw new BadRequestException(
        `Subcategory ${subcategoryId} does not belong to category ${categoryId}`,
      );
    }
    return subcategory;
  }

  private async ensureUniqueSlug(base: string, excludeId?: string) {
    let slug = base || 'produit';
    let suffix = 0;

    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const existing = await this.prisma.product.findUnique({
        where: { slug: candidate },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      suffix += 1;
    }
  }

  private rethrowUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A product with this slug/sku/variant already exists');
    }
    throw error;
  }
}
