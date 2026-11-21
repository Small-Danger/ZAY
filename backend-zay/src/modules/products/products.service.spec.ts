import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { UploadsService } from '../../common/uploads/uploads.service';
import type { AuthUser } from '../auth/decorators/current-user.decorator';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    productVariant: {
      findMany: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    category: { findUnique: jest.Mock };
    subcategory: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let redis: {
    catalogProductsKey: jest.Mock;
    catalogProductKey: jest.Mock;
    getJson: jest.Mock;
    setJson: jest.Mock;
    invalidateCatalog: jest.Mock;
  };

  const admin: AuthUser = {
    id: 'admin-1',
    email: 'admin@zay.local',
    role: Role.ADMIN,
    firstName: 'Admin',
    lastName: 'ZAY',
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      category: { findUnique: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
      subcategory: { findFirst: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
        fn(prisma),
      ),
    };
    redis = {
      catalogProductsKey: jest.fn().mockReturnValue('products-key'),
      catalogProductKey: jest.fn().mockReturnValue('product-key'),
      getJson: jest.fn().mockResolvedValue(undefined),
      setJson: jest.fn().mockResolvedValue(undefined),
      invalidateCatalog: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProductsService(
      prisma as unknown as PrismaService,
      {
        saveImage: jest.fn(),
        deleteIfOwned: jest.fn(),
      } as unknown as UploadsService,
      redis as unknown as RedisService,
    );
  });

  it('refuse originalPrice <= price à la création', async () => {
    await expect(
      service.create({
        name: 'Robe',
        price: 50,
        originalPrice: 40,
        categoryId: 'cat-1',
        image: '/uploads/x.jpg',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('produit brouillon invisible en public, visible avec includeDrafts admin', async () => {
    const draft = {
      id: 'p1',
      slug: 'robe',
      name: 'Robe',
      isPublished: false,
      variants: [],
    };
    prisma.product.findMany.mockResolvedValue([draft]);
    prisma.product.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(draft);

    await service.findAll({});
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublished: true }),
      }),
    );

    await expect(service.findOne('robe')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    const adminView = await service.findOne('robe', admin, true);
    expect(adminView.id).toBe('p1');
    expect(redis.catalogProductKey).toHaveBeenCalledWith('robe', true);
  });

  it('sync variantes : stock mis à jour sans changer l’id', async () => {
    const existing = {
      id: 'prod-1',
      slug: 'robe',
      name: 'Robe',
      price: 50,
      originalPrice: null,
      categoryId: 'cat-1',
      subcategoryId: null,
      image: '/x.jpg',
      images: [],
      isPublished: true,
      variants: [
        {
          id: 'var-keep',
          size: 'M',
          colorName: 'Noir',
          colorHex: '#000',
          sku: null,
          stock: 2,
        },
      ],
    };
    prisma.product.findFirst.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue({ ...existing, stock: 5 });

    const existingVariants = [
      {
        id: 'var-keep',
        size: 'M',
        colorName: 'Noir',
        stock: 2,
      },
    ];
    prisma.productVariant.findMany
      .mockResolvedValueOnce(existingVariants)
      .mockResolvedValueOnce(existingVariants)
      .mockResolvedValueOnce([
        { id: 'var-keep', size: 'M', colorName: 'Noir', stock: 5 },
      ]);
    prisma.productVariant.update.mockResolvedValue({
      id: 'var-keep',
      stock: 5,
    });

    const result = await service.update('prod-1', {
      variants: [
        { size: 'M', colorName: 'Noir', stock: 5 },
      ],
    });

    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'var-keep' },
        data: expect.objectContaining({ stock: 5 }),
      }),
    );
    expect(prisma.productVariant.create).not.toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
