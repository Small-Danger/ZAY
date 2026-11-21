import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchProduct } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/api/config';
import { SITE_NAME, SITE_URL } from '@/lib/site';
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
    const image = resolveMediaUrl(product.image);
    const absoluteImage = image.startsWith('http')
      ? image
      : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    return {
      title: product.name,
      description,
      alternates: {
        canonical: `/produit/${encodeURIComponent(product.slug)}`,
      },
      openGraph: {
        title: `${product.name} | ${SITE_NAME}`,
        description,
        images: [{ url: absoluteImage }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | ${SITE_NAME}`,
        description,
        images: [absoluteImage],
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
    const image = resolveMediaUrl(product.image);
    const absoluteImage = image.startsWith('http')
      ? image
      : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    const inStock = product.stock > 0 || product.status !== 'Rupture';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description || undefined,
      image: [absoluteImage],
      sku: product.id,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'EUR',
        availability: inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${SITE_URL}/produit/${encodeURIComponent(product.slug)}`,
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <ProductView initialProduct={product} />
      </>
    );
  } catch {
    notFound();
  }
}
