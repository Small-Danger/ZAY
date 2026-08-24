'use client';

import Image, { type ImageProps } from 'next/image';
import { API_ORIGIN } from '@/lib/api/config';
import { cn } from '@/lib/utils';

/**
 * next/image optimise via le serveur Next. En Docker, le conteneur front
 * ne peut pas joindre localhost:4000 → /_next/image?url=... renvoie 500.
 * Pour les uploads Nest / blob / data URI : <img> natif (navigateur → API).
 */
export function needsDirectMedia(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return false;
  return (
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    src.includes('/uploads/') ||
    src.includes('/api/media/') ||
    src.includes('res.cloudinary.com') ||
    (!!API_ORIGIN && src.startsWith(API_ORIGIN)) ||
    src.startsWith('http://localhost:') ||
    src.startsWith('http://127.0.0.1:')
  );
}

type Props = ImageProps;

export function MediaImage({
  unoptimized,
  src,
  alt,
  className,
  fill,
  width,
  height,
  style,
  sizes: _sizes,
  priority: _priority,
  placeholder: _placeholder,
  blurDataURL: _blur,
  loader: _loader,
  quality: _quality,
  ...rest
}: Props) {
  const direct = unoptimized === true || needsDirectMedia(src);

  if (direct && typeof src === 'string') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn(fill && 'absolute inset-0 h-full w-full', className)}
        style={style}
        {...(typeof width === 'number' ? { width } : {})}
        {...(typeof height === 'number' ? { height } : {})}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      width={width}
      height={height}
      style={style}
      unoptimized={unoptimized}
      {...rest}
    />
  );
}
