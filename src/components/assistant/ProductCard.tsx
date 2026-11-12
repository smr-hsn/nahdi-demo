import { ArrowUpRight, ExternalLink, ImageOff, LoaderCircle, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProductRecommendation } from '../../lib/formatAssistantMessage'
import { isSafeHttpUrl } from '../../lib/formatAssistantMessage'

type ProductCardProps = {
  product: ProductRecommendation
  variant?: 'chat' | 'voice'
}

type ProductImagePreview = {
  productUrl: string
  imageUrl: string | null
  price?: string
  rating?: string
  ratingCount?: string
  error?: string
}

function previewPayload(payload: unknown): {
  imageUrl: string | null
  price?: string
  rating?: string
  ratingCount?: string
  error: string | null
} {
  if (!payload || typeof payload !== 'object') {
    return { imageUrl: null, error: 'The product page did not return preview data.' }
  }
  const record = payload as Record<string, unknown>
  const imageUrl =
    typeof record.image_url === 'string' && isSafeHttpUrl(record.image_url)
      ? record.image_url
      : null
  const price = typeof record.price === 'string' && record.price.trim() ? record.price.trim() : undefined
  const rating =
    typeof record.rating === 'string' && record.rating.trim() ? record.rating.trim() : undefined
  const ratingCount =
    typeof record.rating_count === 'string' && record.rating_count.trim()
      ? record.rating_count.trim()
      : undefined
  const error = typeof record.error === 'string' ? record.error : null
  return { imageUrl, price, rating, ratingCount, error }
}

function humanizeProductName(name: string, url?: string): string {
  const trimmed = name.trim()
  if (!/^https?:\/\//i.test(trimmed)) return trimmed
  try {
    const path = new URL(url || trimmed).pathname
    const slug = path
      .split('/')
      .filter(Boolean)
      .find((part) => part !== 'en-sa' && part !== 'ar-sa' && part !== 'pdp' && !/^\d+$/.test(part))
    if (!slug) return trimmed
    return slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  } catch {
    return trimmed
  }
}

function formatPriceLabel(price: string): { currency?: string; amount: string } {
  const trimmed = price.trim()
  const match = trimmed.match(/^([A-Za-z]{2,4})\s*(.+)$/)
  if (match) {
    return { currency: match[1].toUpperCase(), amount: match[2].trim() }
  }
  return { amount: trimmed }
}

function PriceBadge({ price, compact = false }: { price: string; compact?: boolean }) {
  const { currency, amount } = formatPriceLabel(price)
  return (
    <span
      className={`inline-flex items-baseline gap-1 rounded-md bg-white/95 font-semibold text-navy-900 shadow-[0_4px_14px_rgba(11,31,58,0.18)] backdrop-blur-sm ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]'
      }`}
    >
      {currency && (
        <span className={`font-bold tracking-wide text-coral-600 ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
          {currency}
        </span>
      )}
      <span>{amount}</span>
    </span>
  )
}

function RatingBadge({
  rating,
  ratingCount,
  compact = false,
}: {
  rating: string
  ratingCount?: string
  compact?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md bg-navy-950/80 font-medium text-white shadow-[0_4px_14px_rgba(11,31,58,0.22)] backdrop-blur-sm ${
        compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[11px]'
      }`}
    >
      <Star
        className={`fill-gold-400 text-gold-400 ${compact ? 'size-2.5' : 'size-3'}`}
        aria-hidden="true"
      />
      <span>{rating}</span>
      {ratingCount && <span className="opacity-80">({ratingCount})</span>}
    </span>
  )
}

export function ProductCard({ product, variant = 'chat' }: ProductCardProps) {
  const [preview, setPreview] = useState<ProductImagePreview | null>(null)
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const url = product.url && isSafeHttpUrl(product.url) ? product.url : undefined
  const providedImageUrl =
    product.imageUrl && isSafeHttpUrl(product.imageUrl) ? product.imageUrl : undefined
  const currentPreview = url && preview?.productUrl === url ? preview : null
  const imageUrl = providedImageUrl ?? currentPreview?.imageUrl ?? undefined
  const isLoadingPreview = Boolean(url && !providedImageUrl && !currentPreview)
  const imageFailed = Boolean(imageUrl && failedImageUrl === imageUrl)
  const displayName = humanizeProductName(product.name, url)
  const brand = product.fields.find((field) => field.label.toLowerCase().includes('brand'))
  const benefit = product.fields.find((field) => field.label.toLowerCase().includes('benefit'))
  const howTo = product.fields.find((field) => {
    const label = field.label.toLowerCase()
    return label.includes('how to') || label.includes('how-to') || label.includes('application')
  })
  const priceField = product.fields.find((field) => /price/i.test(field.label))
  const ratingField = product.fields.find((field) => /rating|stars?/i.test(field.label))
  const ratingCountField = product.fields.find((field) =>
    /rating count|review count|reviews/i.test(field.label),
  )
  const catalogPrice = product.price ?? priceField?.value
  const price = catalogPrice ?? currentPreview?.price
  const rating = product.rating ?? ratingField?.value
  const ratingCount = product.ratingCount ?? ratingCountField?.value ?? currentPreview?.ratingCount
  const previewRating = rating ?? currentPreview?.rating
  const description = product.fields.find((field) =>
    /description|overview|summary/i.test(field.label),
  )
  const chips = product.fields.filter((field) =>
    /suitable for|skin type|skin concern|category/i.test(field.label),
  )
  const excludedFields = new Set(
    [
      brand,
      benefit,
      howTo,
      description,
      priceField,
      ratingField,
      ratingCountField,
      ...chips,
    ].filter(
      (field): field is NonNullable<typeof field> => Boolean(field),
    ),
  )
  const details = product.fields.filter((field) => !excludedFields.has(field))

  useEffect(() => {
    if (!url || (providedImageUrl && catalogPrice)) return

    const controller = new AbortController()
    const query = new URLSearchParams({ url })
    void fetch(`/api/assistant/product-preview?${query}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null)
        const result = previewPayload(payload)
        if (!response.ok || (!result.imageUrl && !result.price && !result.rating)) {
          throw new Error(result.error || 'No product preview data is available for this page.')
        }
        if (!controller.signal.aborted) {
          setPreview({
            productUrl: url,
            imageUrl: result.imageUrl,
            price: result.price,
            rating: result.rating,
            ratingCount: result.ratingCount,
          })
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setPreview({
          productUrl: url,
          imageUrl: null,
          error:
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Unable to load the product image preview.',
        })
      })

    return () => controller.abort()
  }, [catalogPrice, providedImageUrl, url])

  const image = imageUrl && !imageFailed ? (
    <img
      src={imageUrl}
      alt={`${displayName} product image`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailedImageUrl(imageUrl)}
      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
    />
  ) : (
    <div
      className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-blush-50 via-cream to-gold-300/30 text-muted"
      title={currentPreview?.error}
    >
      {isLoadingPreview ? (
        <LoaderCircle className="size-6 animate-spin text-coral-500" aria-hidden="true" />
      ) : (
        <ImageOff className="size-6 text-coral-400" aria-hidden="true" />
      )}
      <span className="px-2 text-center text-[10px]">
        {isLoadingPreview
          ? 'Loading product preview…'
          : imageFailed
            ? 'Product image could not be loaded.'
            : currentPreview?.error ||
              (url
                ? 'Product image preview unavailable'
                : 'A product URL is required for an image preview.')}
      </span>
    </div>
  )

  if (variant === 'voice') {
    return (
      <article
        className="w-28 shrink-0 overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-[0_10px_28px_rgba(11,31,58,0.14)]"
        aria-label={displayName}
      >
        <div className="group relative aspect-square overflow-hidden bg-gradient-to-br from-blush-100 via-cream to-gold-300/25">
          {image}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-navy-950/35 to-transparent"
            aria-hidden="true"
          />
          {price && (
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <PriceBadge price={price} compact />
            </div>
          )}
          {previewRating && (
            <div className="absolute bottom-1.5 right-1.5 z-10">
              <RatingBadge rating={previewRating} ratingCount={ratingCount} compact />
            </div>
          )}
        </div>
        <div className="flex min-h-8 items-center justify-between gap-1 px-2 py-1.5">
          <p className="min-w-0 truncate text-[9px] font-medium leading-tight text-navy-800">
            {displayName}
          </p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${displayName} at Nahdi`}
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white shadow-sm transition hover:scale-105 hover:bg-coral-600"
            >
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </article>
    )
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-blush-200 bg-white shadow-[0_8px_24px_rgba(11,31,58,0.08)]">
      <div
        className="group relative h-40 overflow-hidden bg-gradient-to-br from-blush-100 via-cream to-gold-300/25"
        aria-busy={isLoadingPreview}
      >
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${displayName} at Nahdi`}
            className="block size-full"
          >
            {image}
          </a>
        ) : (
          image
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-navy-950/40 to-transparent"
          aria-hidden="true"
        />
        {price && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <PriceBadge price={price} />
          </div>
        )}
        {previewRating && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <RatingBadge rating={previewRating} ratingCount={ratingCount} />
          </div>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        {brand && (
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-coral-600">
            {brand.value}
          </p>
        )}
        <h4 className="break-words font-display text-lg font-semibold leading-snug text-navy-900">
          {displayName}
        </h4>

        {description && (
          <p className="text-[11px] leading-relaxed text-muted">{description.value}</p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((field) => (
              <span
                key={`${field.label}:${field.value}`}
                className="rounded-full border border-blush-200 bg-blush-50 px-2.5 py-1 text-[9px] font-medium text-navy-800"
              >
                {field.value}
              </span>
            ))}
          </div>
        )}

        {details.length > 0 && (
          <dl className="space-y-1.5 text-[11px] leading-relaxed text-muted">
            {details.map((field) => (
              <div key={`${field.label}:${field.value}`}>
                <dt className="inline font-semibold text-navy-800">{field.label}: </dt>
                <dd className="inline">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {benefit && (
          <div className="rounded-xl border border-blush-100 bg-blush-50/80 p-3 text-[11px] leading-relaxed text-navy-800">
            <span className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-coral-600">
              {benefit.label}
            </span>
            {benefit.value}
          </div>
        )}

        {howTo && (
          <details className="group/howto rounded-xl border border-blush-100 px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-semibold text-navy-800 marker:content-none">
              <span aria-hidden="true">＋</span>
              {howTo.label}
            </summary>
            <p className="ml-4 mt-2 border-l-2 border-coral-300 pl-2.5 text-[11px] leading-relaxed text-muted">
              {howTo.value}
            </p>
          </details>
        )}
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-xl bg-navy-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:bg-coral-600"
        >
          <span className="min-w-0 truncate">View product at Nahdi</span>
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        </a>
      ) : (
        <p className="mx-3 mb-3 rounded-xl border border-blush-100 bg-blush-50 px-3.5 py-2.5 text-[10px] text-muted">
          Product link was not provided by the knowledge base.
        </p>
      )}
    </article>
  )
}
