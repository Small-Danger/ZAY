import { apiFetch, apiFetchForm } from './client';
import { mapApiProductToUi } from './mappers';
import type { ApiProduct, UiProduct } from './types';

export type ProductListParams = {
  categoryId?: string;
  subcategoryId?: string;
  isNew?: boolean;
  isPromo?: boolean;
  search?: string;
};

export type ProductVariantPayload = {
  size: string;
  colorName: string;
  colorHex?: string;
  sku?: string;
  stock: number;
};

export type CreateProductPayload = {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number | null;
  stock?: number;
  image?: string;
  imageFile?: File | null;
  /** URLs galerie à conserver (hors couverture) */
  images?: string[];
  /** Nouveaux fichiers galerie */
  galleryFiles?: File[];
  badge?: string;
  isNew?: boolean;
  isPromo?: boolean;
  categoryId: string;
  subcategoryId?: string;
  variants?: ProductVariantPayload[];
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

function appendProductForm(
  form: FormData,
  payload: CreateProductPayload | UpdateProductPayload,
) {
  if (payload.name !== undefined) form.append('name', payload.name);
  if (payload.description !== undefined) {
    form.append('description', payload.description);
  }
  if (payload.price !== undefined) form.append('price', String(payload.price));
  if (payload.originalPrice === null) {
    form.append('originalPrice', 'null');
  } else if (payload.originalPrice !== undefined) {
    form.append('originalPrice', String(payload.originalPrice));
  }
  if (payload.stock !== undefined) form.append('stock', String(payload.stock));
  if (payload.image !== undefined && !payload.imageFile) {
    form.append('image', payload.image);
  }
  if (payload.badge !== undefined) form.append('badge', payload.badge);
  if (payload.isNew !== undefined) form.append('isNew', String(payload.isNew));
  if (payload.isPromo !== undefined) {
    form.append('isPromo', String(payload.isPromo));
  }
  if (payload.categoryId !== undefined) {
    form.append('categoryId', payload.categoryId);
  }
  if (payload.subcategoryId !== undefined) {
    form.append('subcategoryId', payload.subcategoryId);
  }
  if (payload.variants !== undefined) {
    form.append('variants', JSON.stringify(payload.variants));
  }
  if (payload.images !== undefined) {
    form.append('images', JSON.stringify(payload.images));
  }
  if (payload.imageFile) form.append('image', payload.imageFile);
  for (const file of payload.galleryFiles || []) {
    form.append('gallery', file);
  }
}

export async function fetchProducts(
  params: ProductListParams = {},
): Promise<UiProduct[]> {
  const query = new URLSearchParams();
  if (params.categoryId) query.set('categoryId', params.categoryId);
  if (params.subcategoryId) query.set('subcategoryId', params.subcategoryId);
  if (typeof params.isNew === 'boolean') query.set('isNew', String(params.isNew));
  if (typeof params.isPromo === 'boolean') {
    query.set('isPromo', String(params.isPromo));
  }
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  const data = await apiFetch<ApiProduct[]>(`/products${qs ? `?${qs}` : ''}`);
  return data.map(mapApiProductToUi);
}

export async function fetchProduct(idOrSlug: string): Promise<UiProduct> {
  const data = await apiFetch<ApiProduct>(
    `/products/${encodeURIComponent(idOrSlug)}`,
  );
  return mapApiProductToUi(data);
}

function needsMultipart(payload: CreateProductPayload | UpdateProductPayload) {
  return !!(
    payload.imageFile ||
    (payload.galleryFiles && payload.galleryFiles.length > 0)
  );
}

export async function createProduct(
  payload: CreateProductPayload,
): Promise<UiProduct> {
  if (needsMultipart(payload) || payload.images !== undefined) {
    const form = new FormData();
    appendProductForm(form, payload);
    const data = await apiFetchForm<ApiProduct>('/products', {
      method: 'POST',
      body: form,
    });
    return mapApiProductToUi(data);
  }

  const { imageFile: _f, galleryFiles: _g, ...json } = payload;
  const data = await apiFetch<ApiProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(json),
  });
  return mapApiProductToUi(data);
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<UiProduct> {
  if (needsMultipart(payload) || payload.images !== undefined) {
    const form = new FormData();
    appendProductForm(form, payload);
    const data = await apiFetchForm<ApiProduct>(`/products/${id}`, {
      method: 'PATCH',
      body: form,
    });
    return mapApiProductToUi(data);
  }

  const { imageFile: _f, galleryFiles: _g, ...json } = payload;
  const data = await apiFetch<ApiProduct>(`/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(json),
  });
  return mapApiProductToUi(data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<void>(`/products/${id}`, { method: 'DELETE' });
}
