'use client';

import Image from 'next/image';
import { getClubLogoUrl, isClubLogoPlaceholder, getOptimizedCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

interface ClubLogoImageProps {
  clubName: string;
  dbLogo?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Club logo image component that auto-handles unoptimized for data URI placeholders.
 * Next.js Image optimizer can't process SVG data URIs, so we skip optimization for those.
 *
 * Cloudinary URLs are now optimized via getOptimizedCloudinaryUrl() which injects
 * f_auto,q_auto:eco,w_*,c_limit directly into the URL. This means even with
 * `unoptimized` prop, the browser receives an optimized image from Cloudinary CDN.
 *
 * Broken image fallback: If a Cloudinary URL returns 404, we retry with
 * the original URL. If that also fails, we render a styled placeholder div
 * with the club's first letter.
 */
export function ClubLogoImage({
  clubName,
  dbLogo,
  alt,
  width,
  height,
  fill,
  sizes,
  className,
  style,
}: ClubLogoImageProps) {
  const rawSrc = getClubLogoUrl(clubName, dbLogo);
  const isPlaceholder = isClubLogoPlaceholder(rawSrc);

  // Optimize Cloudinary URLs — inject f_auto,q_auto:eco,w_*,c_limit
  // For non-fill mode, use the component's width prop; for fill mode, use 128px (logo size)
  const logoWidth = fill ? 128 : (width || 32);
  const src = isCloudinaryUrl(rawSrc) ? getOptimizedCloudinaryUrl(rawSrc, logoWidth) : rawSrc;

  // Error stage: 0 = normal, 1 = retry with original URL, 2 = show fallback div
  const [errorStage, setErrorStage] = useState(0);

  // Reset error state when src changes (e.g., new logo uploaded)
  useEffect(() => {
    setTimeout(() => setErrorStage(0), 0);
  }, [src]);

  const handleError = () => {
    setErrorStage((prev) => Math.min(prev + 1, 2));
  };

  // Fallback: styled div with the first letter of the club name
  if (errorStage === 2) {
    const letter = clubName.charAt(0).toUpperCase();
    const size = fill ? undefined : (width || 32);
    const containerStyle: CSSProperties = fill
      ? { ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }
      : { ...style, width: size, height: size || width || 32, display: 'flex', alignItems: 'center', justifyContent: 'center' };

    return (
      <div
        className={className}
        style={containerStyle}
        role="img"
        aria-label={alt || clubName}
      >
        <span className="text-idm-gold-warm font-bold select-none" style={{ fontSize: fill ? '1.25rem' : `${(size || 32) * 0.5}px` }}>
          {letter}
        </span>
      </div>
    );
  }

  // On error stage 1, retry with the raw (non-optimized) URL in case
  // the Cloudinary transformation URL is broken but the original works
  const imgSrc = errorStage >= 1 && isCloudinaryUrl(rawSrc) ? rawSrc : src;

  // Always use unoptimized for Cloudinary URLs because:
  // 1. Data URI placeholders can't be optimized by Next.js
  // 2. Cloudinary URLs are already optimized via getOptimizedCloudinaryUrl() —
  //    the URL itself has f_auto,q_auto:eco,w_*,c_limit baked in.
  // 3. Without unoptimized, Next.js cloudinary-loader would try to add ANOTHER
  //    layer of transformations, causing "loader does not implement width" warnings.
  const shouldUnoptimize = isPlaceholder || isCloudinaryUrl(imgSrc) || errorStage >= 1;

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt || clubName}
        fill
        sizes={sizes}
        className={className}
        style={style}
        unoptimized={shouldUnoptimize}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt || clubName}
      width={width || 32}
      height={height || 32}
      className={className}
      style={style}
      unoptimized={shouldUnoptimize}
      onError={handleError}
    />
  );
}
