type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function displayValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)

  const record = asRecord(value)
  if (!record) return undefined
  const formatted =
    asString(record.formatted) ||
    asString(record.formatted_value) ||
    asString(record.display) ||
    asString(record.label)
  if (formatted) return formatted
  const nested = record.amount ?? record.value ?? record.price
  if (nested === value) return undefined
  const display = displayValue(nested)
  const currency = asString(record.currency) || asString(record.currency_code)
  if (!display || !currency || display.toLowerCase().includes(currency.toLowerCase())) {
    return display
  }
  return `${currency} ${display}`
}

function firstDisplayValue(record: JsonRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = displayValue(record[key])
    if (value) return value
  }
  return undefined
}

const WRAPPER_KEYS = ['data', 'raw', 'result', 'response', 'output', 'payload'] as const

function nestedRecords(payload: unknown): JsonRecord[] {
  const records: JsonRecord[] = []
  const seen = new Set<object>()
  const queue: { value: unknown; depth: number }[] = [{ value: payload, depth: 0 }]

  while (queue.length) {
    const current = queue.shift()
    if (!current || current.depth > 4) continue
    const record = asRecord(current.value)
    if (!record || seen.has(record)) continue
    seen.add(record)
    records.push(record)
    for (const key of WRAPPER_KEYS) {
      if (record[key] !== undefined) {
        queue.push({ value: record[key], depth: current.depth + 1 })
      }
    }
  }

  return records
}

export type ExtractedProduct = {
  name: string
  url: string
  imageUrl?: string
  price?: string
  rating?: string
  ratingCount?: string
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function extractProducts(payload: unknown): ExtractedProduct[] {
  const records = nestedRecords(payload)
  if (!records.length) return []
  const buckets = records.flatMap((record) => [
    record.products,
    record.items,
    record.recommendations,
  ])

  const seen = new Set<string>()
  const products: ExtractedProduct[] = []

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue
    for (const item of bucket) {
      const rec = asRecord(item)
      if (!rec) continue
      const url =
        asString(rec.url) ||
        asString(rec.link) ||
        asString(rec.product_url) ||
        asString(rec.href)
      const name =
        asString(rec.name) ||
        asString(rec.title) ||
        asString(rec.product_name) ||
        asString(rec.label)
      if (!url || !name || !isHttpUrl(url) || seen.has(url)) continue
      seen.add(url)
      const imageCandidates = [
        rec.image,
        rec.image_url,
        rec.imageUrl,
        rec.thumbnail,
        ...(Array.isArray(rec.images) ? rec.images : []),
        ...(Array.isArray(rec.image_urls) ? rec.image_urls : []),
      ]
      const imageUrl =
        imageCandidates
          .map(asString)
          .find((image): image is string => Boolean(image)) || undefined
      const currency = asString(rec.currency) || asString(rec.currency_code)
      const rawPrice = firstDisplayValue(rec, [
        'price',
        'formatted_price',
        'display_price',
        'final_price',
        'sale_price',
        'special_price',
      ])
      const price =
        rawPrice && currency && !rawPrice.toLowerCase().includes(currency.toLowerCase())
          ? `${currency} ${rawPrice}`
          : rawPrice
      const ratingRecord = asRecord(rec.rating)
      const rating =
        firstDisplayValue(rec, [
          'average_rating',
          'rating_value',
          'rating_average',
          'stars',
          'rating',
        ]) || (ratingRecord ? firstDisplayValue(ratingRecord, ['value', 'average']) : undefined)
      const ratingCount =
        firstDisplayValue(rec, ['rating_count', 'review_count', 'reviews_count']) ||
        (ratingRecord ? firstDisplayValue(ratingRecord, ['count', 'review_count']) : undefined)
      products.push({
        name,
        url,
        ...(imageUrl && isHttpUrl(imageUrl) ? { imageUrl } : {}),
        ...(price ? { price } : {}),
        ...(rating ? { rating } : {}),
        ...(ratingCount ? { ratingCount } : {}),
      })
    }
  }

  const answers = records.flatMap((record) => [
    asString(record.answer),
    asString(record.response),
    asString(record.message),
    asString(record.output),
  ])
  for (const extra of [
    ...extractCitationProducts(payload),
    ...answers.filter((answer): answer is string => Boolean(answer)).flatMap(extractProductsFromText),
  ]) {
    if (seen.has(extra.url)) continue
    seen.add(extra.url)
    products.push(extra)
  }

  return products
}

export function extractProductsFromText(text: string): ExtractedProduct[] {
  if (!text.trim()) return []
  const seen = new Set<string>()
  const products: ExtractedProduct[] = []
  const linkedImagePattern =
    /\[!\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\]\((https?:\/\/[^)\s]+)\)/g
  const textWithoutLinkedImages = text.replace(
    linkedImagePattern,
    (_match, rawName: string, rawImageUrl: string, rawUrl: string) => {
      const name = rawName.trim()
      const url = rawUrl.replace(/[),.;]+$/g, '').trim()
      const imageUrl = rawImageUrl.replace(/[),.;]+$/g, '').trim()
      if (!name || !isHttpUrl(url) || !isHttpUrl(imageUrl) || seen.has(url)) {
        return ''
      }
      seen.add(url)
      products.push({ name, url, imageUrl })
      return ''
    },
  )
  const patterns = [
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    /<\s*(https?:\/\/[^>\s]+)\s*>/g,
    /https?:\/\/[^\s<>"'`]+/g,
  ]

  for (const pattern of patterns) {
    for (const match of textWithoutLinkedImages.matchAll(pattern)) {
      const url = (match[2] || match[1] || match[0] || '').replace(/[),.;]+$/g, '').trim()
      const name = (match[2] ? match[1] : '').trim()
      if (!url || !isHttpUrl(url) || seen.has(url)) continue
      seen.add(url)
      products.push({
        name: name || url,
        url,
      })
    }
  }

  return products
}

function extractCitationProducts(payload: unknown): ExtractedProduct[] {
  const products: ExtractedProduct[] = []
  const seen = new Set<string>()
  for (const record of nestedRecords(payload)) {
    if (!Array.isArray(record.citations)) continue
    for (const item of record.citations) {
      const rec = asRecord(item)
      if (!rec) continue
      const url =
        asString(rec.url) ||
        asString(rec.link) ||
        asString(rec.source_url) ||
        asString(rec.href)
      const name =
        asString(rec.title) ||
        asString(rec.name) ||
        asString(rec.document) ||
        asString(rec.source)
      if (!url || !isHttpUrl(url) || seen.has(url)) continue
      seen.add(url)
      products.push({ name: name || url, url })
    }
  }
  return products
}

export function extractAskAnswer(payload: unknown): string | null {
  for (const record of nestedRecords(payload)) {
    for (const key of ['answer', 'response', 'message', 'output'] as const) {
      const text = asString(record[key])
      if (text) return text
    }
  }

  return null
}

export function extractAskError(payload: unknown, status: number): string {
  const root = asRecord(payload)
  const error = root?.error
  if (typeof error === 'string' && error.trim()) return error.trim()
  const errorObj = asRecord(error)
  const nestedMessage = asString(errorObj?.message)
  if (nestedMessage) return nestedMessage
  const message = asString(root?.message)
  if (message && !asString(root?.answer) && !asString(root?.response)) return message
  return `IDRAK request failed (${status})`
}

export type LiveKitCredentials = {
  url: string
  token: string
  roomName: string | null
  participantIdentity: string | null
  expiresIn: number | null
  sessionId: string | null
}

export function extractLiveKitCredentials(payload: unknown): LiveKitCredentials | null {
  const root = asRecord(payload)
  if (!root) return null
  const voice = asRecord(root.voice)
  const data = asRecord(root.data)

  const url =
    asString(voice?.url) ||
    asString(root.livekit_url) ||
    asString(root.url) ||
    asString(data?.url) ||
    asString(asRecord(data?.voice)?.url)

  const token =
    asString(voice?.token) ||
    asString(root.access_token) ||
    asString(root.token) ||
    asString(data?.token) ||
    asString(asRecord(data?.voice)?.token)

  if (!url || !token) return null

  return {
    url,
    token,
    roomName:
      asString(voice?.room_name) ||
      asString(root.room_name) ||
      asString(root.roomName) ||
      null,
    participantIdentity:
      asString(voice?.participant_identity) ||
      asString(root.participant_identity) ||
      null,
    expiresIn:
      typeof voice?.expires_in === 'number'
        ? voice.expires_in
        : typeof root.expires_in === 'number'
          ? root.expires_in
          : null,
    sessionId: asString(root.session_id) || asString(voice?.session_id),
  }
}

export function topLevelKeys(payload: unknown): string[] {
  const root = asRecord(payload)
  return root ? Object.keys(root) : []
}

export function extractVoiceError(payload: unknown, status: number): string {
  const root = asRecord(payload)
  const error = root?.error
  if (typeof error === 'string' && error.trim()) return error.trim()
  const errorObj = asRecord(error)
  const nested = asString(errorObj?.message)
  if (nested) return nested
  const detail = root?.detail
  if (typeof detail === 'string' && detail.trim()) return detail.trim()
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => asString(asRecord(item)?.msg))
      .filter((message): message is string => Boolean(message))
    if (messages.length) return messages.join(' ')
  }
  return asString(root?.message) || `Voice session failed (${status})`
}
