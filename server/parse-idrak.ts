type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export type ExtractedProduct = {
  name: string
  url: string
  imageUrl?: string
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

export function extractProducts(payload: unknown): ExtractedProduct[] {
  const root = asRecord(payload)
  if (!root) return []

  const nested = [root.data, root.raw, root.result].map(asRecord)
  const buckets = [
    root.products,
    root.items,
    root.recommendations,
    nested[0]?.products,
    nested[0]?.items,
    nested[1]?.products,
    nested[2]?.products,
  ]

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
      const imageUrl =
        asString(rec.image) ||
        asString(rec.image_url) ||
        asString(rec.thumbnail) ||
        undefined
      products.push({
        name,
        url,
        imageUrl: imageUrl && isHttpUrl(imageUrl) ? imageUrl : undefined,
      })
    }
  }

  const answer =
    asString(root.answer) ||
    asString(root.response) ||
    asString(asRecord(root.raw)?.answer) ||
    ''
  for (const extra of [...extractCitationProducts(root), ...extractProductsFromText(answer)]) {
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
  const patterns = [
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    /<\s*(https?:\/\/[^>\s]+)\s*>/g,
    /https?:\/\/[^\s<>"'`]+/g,
  ]

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
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
  const root = asRecord(payload)
  const citations = root?.citations
  if (!Array.isArray(citations)) return []
  const products: ExtractedProduct[] = []
  const seen = new Set<string>()
  for (const item of citations) {
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
  return products
}

export function extractAskAnswer(payload: unknown): string | null {
  const root = asRecord(payload)
  if (!root) return null

  const nested = [root.raw, root.data, root.result].map(asRecord)
  const candidates = [
    root.answer,
    root.response,
    root.message,
    root.output,
    nested[0]?.answer,
    nested[0]?.response,
    nested[1]?.answer,
    nested[1]?.response,
    typeof nested[2]?.answer === 'string' ? nested[2].answer : null,
  ]

  for (const candidate of candidates) {
    const text = asString(candidate)
    if (text) return text
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
  return asString(root?.message) || `Voice session failed (${status})`
}
