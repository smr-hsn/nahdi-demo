export type ProductPageMetadata = {
  price?: string
  rating?: string
  ratingCount?: string
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

function hasType(record: JsonRecord, type: string): boolean {
  const value = record['@type']
  return Array.isArray(value)
    ? value.some((item) => item === type)
    : value === type
}

function productRecords(value: unknown, depth = 0): JsonRecord[] {
  if (depth > 8) return []
  if (Array.isArray(value)) return value.flatMap((item) => productRecords(item, depth + 1))
  if (!isRecord(value)) return []

  const products = hasType(value, 'Product') ? [value] : []
  return [...products, ...Object.values(value).flatMap((item) => productRecords(item, depth + 1))]
}

function firstNumber(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = stringValue(record[key])
    if (value && Number.isFinite(Number(value))) return value
  }
  return undefined
}

function productMetadata(value: unknown): ProductPageMetadata {
  for (const product of productRecords(value)) {
    const ratingValue = isRecord(product.aggregateRating)
      ? product.aggregateRating
      : undefined
    const rating = ratingValue
      ? firstNumber(ratingValue, ['ratingValue', 'rating'])
      : undefined
    const ratingCount = ratingValue
      ? firstNumber(ratingValue, ['reviewCount', 'ratingCount'])
      : undefined
    const offers = Array.isArray(product.offers) ? product.offers : [product.offers]
    for (const offerValue of offers) {
      if (!isRecord(offerValue)) continue
      const amount =
        firstNumber(offerValue, ['price', 'lowPrice']) ??
        firstNumber(offerValue, ['highPrice'])
      if (!amount) continue

      const currency = stringValue(offerValue.priceCurrency)
      const price = currency ? `${currency} ${amount}` : amount
      return {
        price,
        ...(rating ? { rating } : {}),
        ...(ratingCount ? { ratingCount } : {}),
      }
    }
    if (rating || ratingCount) {
      return {
        ...(rating ? { rating } : {}),
        ...(ratingCount ? { ratingCount } : {}),
      }
    }
  }
  return {}
}

export function extractProductPageMetadata(html: string): ProductPageMetadata {
  const metadata: ProductPageMetadata = {}
  const scripts = html.matchAll(
    /<script\b(?=[^>]*\btype\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json'|application\/ld\+json))[^>]*>([\s\S]*?)<\/script>/gi,
  )

  for (const match of scripts) {
    try {
      const parsed: unknown = JSON.parse(match[1])
      const found = productMetadata(parsed)
      if (!metadata.price && found.price) metadata.price = found.price
      if (!metadata.rating && found.rating) metadata.rating = found.rating
      if (!metadata.ratingCount && found.ratingCount) metadata.ratingCount = found.ratingCount
      if (metadata.price && metadata.rating && metadata.ratingCount) return metadata
    } catch {
      continue
    }
  }

  return metadata
}
