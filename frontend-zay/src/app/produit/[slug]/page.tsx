import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProduct } from '@/lib/api';
import { SITE_NAME } from '@/lib/site';
import { ProductView } from './product-view';

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await fetchProduct(slug);
    const description =
      product.description?.slice(0, 160) ||
      `${product.name} — ${SITE_NAME}`;
    return {
      title: product.name,
      description,
      openGraph: {
        title: `${product.name} | ${SITE_NAME}`,
        description,
        images: product.image ? [{ url: product.image }] : undefined,
      },
    };
  } catch {
    return { title: 'Produit' };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  try {
    const product = await fetchProduct(slug);
    return <ProductView initialProduct={product} />;
  } catch {
    notFound();
  }
}
