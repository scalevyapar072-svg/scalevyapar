'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, ImgHTMLAttributes } from 'react'
import { normalizeWebsiteAssetPath } from '@/lib/labour-company-public-assets'

type PublicAssetImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null
  fallbackSrc: string
  widthPx?: number | null
  maxWidthCss?: string
  style?: CSSProperties
}

export function PublicAssetImage({
  src,
  fallbackSrc,
  alt,
  className,
  widthPx,
  maxWidthCss,
  style,
  loading = 'eager',
  decoding = 'async',
  ...rest
}: PublicAssetImageProps) {
  const normalizedFallback = normalizeWebsiteAssetPath(fallbackSrc, fallbackSrc)
  const normalizedSource = normalizeWebsiteAssetPath(src, normalizedFallback)
  const [currentSrc, setCurrentSrc] = useState(normalizedSource)

  useEffect(() => {
    setCurrentSrc(normalizedSource)
  }, [normalizedSource])

  return (
    <img
      {...rest}
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      style={{
        ...style,
        ...(widthPx && widthPx > 0 ? { width: `${widthPx}px` } : null),
        ...(maxWidthCss ? { maxWidth: maxWidthCss } : null)
      }}
      onError={() => {
        if (currentSrc !== normalizedFallback) {
          setCurrentSrc(normalizedFallback)
        }
      }}
    />
  )
}
