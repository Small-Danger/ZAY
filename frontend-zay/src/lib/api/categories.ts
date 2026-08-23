import { apiFetch, apiFetchForm } from './client';

export type ApiSubcategory = {
  id: string;
  name: string;
  categoryId: string;
  image?: string | null;
};

export type ApiCategory = {
  id: string;
  name: string;
  image?: string | null;
  subcategories?: ApiSubcategory[];
};

export async function fetchCategories(): Promise<ApiCategory[]> {
  return apiFetch<ApiCategory[]>('/categories');
}

export async function createCategory(
  name: string,
  imageFile?: File | null,
): Promise<ApiCategory> {
  const form = new FormData();
  form.append('name', name);
  if (imageFile) form.append('image', imageFile);
  return apiFetchForm<ApiCategory>('/categories', {
    method: 'POST',
    body: form,
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; imageFile?: File | null },
): Promise<ApiCategory> {
  const form = new FormData();
  if (data.name !== undefined) form.append('name', data.name);
  if (data.imageFile) form.append('image', data.imageFile);
  return apiFetchForm<ApiCategory>(`/categories/${id}`, {
    method: 'PATCH',
    body: form,
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<void>(`/categories/${id}`, { method: 'DELETE' });
}

export async function fetchSubcategories(
  categoryId: string,
): Promise<ApiSubcategory[]> {
  return apiFetch<ApiSubcategory[]>(`/categories/${categoryId}/subcategories`);
}

export async function createSubcategory(
  categoryId: string,
  name: string,
  imageFile?: File | null,
): Promise<ApiSubcategory> {
  const form = new FormData();
  form.append('name', name);
  if (imageFile) form.append('image', imageFile);
  return apiFetchForm<ApiSubcategory>(`/categories/${categoryId}/subcategories`, {
    method: 'POST',
    body: form,
  });
}

export async function updateSubcategory(
  categoryId: string,
  subId: string,
  data: { name?: string; imageFile?: File | null },
): Promise<ApiSubcategory> {
  const form = new FormData();
  if (data.name !== undefined) form.append('name', data.name);
  if (data.imageFile) form.append('image', data.imageFile);
  return apiFetchForm<ApiSubcategory>(
    `/categories/${categoryId}/subcategories/${subId}`,
    {
      method: 'PATCH',
      body: form,
    },
  );
}

export async function deleteSubcategory(
  categoryId: string,
  subId: string,
): Promise<void> {
  await apiFetch<void>(`/categories/${categoryId}/subcategories/${subId}`, {
    method: 'DELETE',
  });
}
