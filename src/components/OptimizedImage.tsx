import { useState } from 'react'

type OptimizedImageProps = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  sizes?: string
  priority?: boolean
}

function isRemote(src: string) {
  return /^https?:\/\//i.test(src)
}

function withWidth(src: string, width: number): string {
  if (!isRemote(src)) return src
  try {
    const url = new URL(src)
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('q', '80')
    url.searchParams.set('w', String(width))
    return url.toString()
  } catch {
    return src
  }
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
}: OptimizedImageProps) {
  const [failed, setFailed] = useState(false)
  const remote = isRemote(src)
  const widths = [400, 800, 1200, 1600].filter((w) => w <= Math.max(width * 2, 800))
  const srcSet = remote
    ? widths.map((w) => `${withWidth(src, w)} ${w}w`).join(', ')
    : undefined

  if (failed) {
    return (
      <div
        className={`bg-gradient-to-br from-blush-100 via-blush-200 to-navy-800/20 ${className ?? ''}`}
        style={{ width: '100%', height: '100%' }}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      />
    )
  }

  return (
    <img
      src={withWidth(src, width)}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      onError={() => setFailed(true)}
    />
  )
}
