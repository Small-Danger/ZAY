import type { Metadata } from 'next';
import { fetchCategories, fetchProducts } from '@/lib/api';
import { CatalogueClient } from './catalogue-client';

export const metadata: Metadata = {
  title: 'Catalogue',
  description:
    'Parcourez la collection ZAY Atelier : nouveautés, pièces signature et prêt-à-porter féminin.',
};

export default async function CataloguePage() {
  const [products, categories] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchCategories().catch(() => []),
  ]);

  return (
    <CatalogueClient
      initialProducts={products}
      initialCategories={categories}
    />
  );
}
