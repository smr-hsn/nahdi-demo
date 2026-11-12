import type { IncomingMessage, ServerResponse } from 'node:http'
import { randomUUID } from 'node:crypto'
import {
  isChatConfigured,
  isVoiceConfigured,
  type IdrakConfig,
} from './idrak-config.ts'
import {
  extractAskAnswer,
  extractAskError,
  extractLiveKitCredentials,
  extractProducts,
  extractVoiceError,
} from './parse-idrak.ts'
import { extractProductPageMetadata } from './parse-product-page.ts'
import { rateLimit } from './rate-limit.ts'

const ASK_TIMEOUT_MS = 30_000
const VOICE_TIMEOUT_MS = 30_000
const PRODUCT_PREVIEW_TIMEOUT_MS = 8_000
const PRODUCT_HTML_LIMIT = 2_000_000
const PRODUCT_PREVIEW_CACHE_MS = 60 * 60 * 1_000
const MAX_QUESTION = 4000
const SESSION_ID_RE = /^[A-Za-z0-9:_-]{1,128}$/
const productPreviewCache = new Map<
  string,
  { imageUrl?: string; price?: string; rating?: string; ratingCount?: string; expiresAt: number }
>()

function isNahdiHost(url: URL): boolean {
  const hostname = url.hostname.toLowerCase()
  return (
    url.protocol === 'https:' &&
    !url.username &&
    !url.password &&
    (!url.port || url.port === '443') &&
    (hostname === 'nahdionline.com' || hostname.endsWith('.nahdionline.com'))
  )
}

function isNahdiProductUrl(value: string): URL | null {
  try {
    const url = new URL(value)
    return isNahdiHost(url) && /\/pdp(?:\/|$)/i.test(url.pathname) ? url : null
  } catch {
    return null
  }
}

function htmlAttribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'),
  )
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null
}

function productImageFromHtml(html: string, pageUrl: URL): string | null {
  const imageProperties = new Set([
    'og:image',
    'og:image:secure_url',
    'twitter:image',
    'twitter:image:src',
  ])
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []

  for (const tag of tags) {
    const property = (
      htmlAttribute(tag, 'property') ??
      htmlAttribute(tag, 'name') ??
      ''
    ).toLowerCase()
    if (!imageProperties.has(property)) continue
    const rawImage = htmlAttribute(tag, 'content')
    if (!rawImage) continue

    try {
      const imageUrl = new URL(
        rawImage.replace(/&amp;/gi, '&').replace(/&#x2f;/gi, '/'),
        pageUrl,
      )
      if (imageUrl.protocol === 'https:' && !imageUrl.username && !imageUrl.password) {
        return imageUrl.toString()
      }
    } catch {
      continue
    }
  }

  return null
}

async function fetchNahdiProductPage(url: URL, signal: AbortSignal): Promise<Response> {
  let current = url
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: { Accept: 'text/html' },
      signal,
    })
    if (response.status < 300 || response.status >= 400) return response

    const location = response.headers.get('location')
    if (!location || redirectCount === 3) {
      throw new Error('The product page redirected too many times.')
    }
    const redirectedUrl = new URL(location, current)
    if (!isNahdiHost(redirectedUrl)) {
      throw new Error('The product page redirected outside Nahdi.')
    }
    current = redirectedUrl
  }
  throw new Error('The product page could not be loaded.')
}

function headerValue(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers?.[name]
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return undefined
}

function corsHeaders(req: IncomingMessage, config: IdrakConfig): Record<string, string> {
  const origin = headerValue(req, 'origin')
  if (!origin) return {}
  if (!isAllowedOrigin(req, config)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(
  req: IncomingMessage,
  res: ServerResponse,
  config: IdrakConfig,
  status: number,
  body: unknown,
  extra?: Record<string, string>,
) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...corsHeaders(req, config),
    ...extra,
  })
  res.end(payload)
}

function clientIp(req: IncomingMessage): string {
  const forwarded = headerValue(req, 'x-forwarded-for')
  if (forwarded?.trim()) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return req.socket?.remoteAddress || 'unknown'
}

function isAllowedOrigin(req: IncomingMessage, config: IdrakConfig): boolean {
  const origin = headerValue(req, 'origin')
  if (!origin) return true
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true
  return config.allowedOrigins.includes(origin)
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buf.length
    if (size > 32_768) throw new Error('payload_too_large')
    chunks.push(buf)
  }
  if (chunks.length === 0) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return {}
  return JSON.parse(raw) as unknown
}

async function idrakFetch(
  config: IdrakConfig,
  path: string,
  body: unknown,
  timeoutMs: number,
  apiKey: string = config.apiKey,
): Promise<{ status: number; json: unknown; ok: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = (await response.json().catch(() => ({}))) as unknown
    return { status: response.status, json, ok: response.ok }
  } finally {
    clearTimeout(timer)
  }
}

async function realtimeTokenFetch(
  config: IdrakConfig,
  body: unknown,
): Promise<{ status: number; json: unknown; ok: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), VOICE_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.voiceTokenBaseUrl}/realtime/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': config.realtimeTokenApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const json = (await response.json().catch(() => ({}))) as unknown
    return { status: response.status, json, ok: response.ok }
  } finally {
    clearTimeout(timer)
  }
}

export async function handleIdrakProxy(
  req: IncomingMessage,
  res: ServerResponse,
  config: IdrakConfig,
): Promise<boolean> {
  const url = new URL(req.url || '/', 'http://localhost')
  const pathname = url.pathname

  if (!pathname.startsWith('/api/assistant')) return false

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(req, config)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Origin is not allowed.' }))
      return true
    }
    res.writeHead(204, {
      ...corsHeaders(req, config),
      'Access-Control-Max-Age': '600',
    })
    res.end()
    return true
  }

  if (!isAllowedOrigin(req, config)) {
    json(req, res, config, 403, { error: 'Origin is not allowed.' })
    return true
  }

  if (pathname === '/api/assistant/health' && req.method === 'GET') {
    json(req, res, config, 200, {
      ok: isChatConfigured(config),
      configured: isChatConfigured(config),
    })
    return true
  }

  if (pathname === '/api/assistant/chat' && req.method === 'POST' && !isChatConfigured(config)) {
    json(req, res, config, 503, {
      error: 'The assistant is temporarily unavailable. Please try again later.',
    })
    return true
  }

  if (
    pathname === '/api/assistant/voice/session' &&
    req.method === 'POST' &&
    !isVoiceConfigured(config)
  ) {
    json(req, res, config, 503, {
      error: 'The voice assistant is temporarily unavailable. Please try again later.',
    })
    return true
  }

  const ip = clientIp(req)

  if (pathname === '/api/assistant/product-preview' && req.method === 'GET') {
    const limit = rateLimit({ key: `product-preview:${ip}`, limit: 30, windowMs: 60_000 })
    if (!limit.ok) {
      json(req, res, config, 429, { error: 'Too many product image requests. Please wait and try again.' }, {
        'Retry-After': String(limit.retryAfterSec),
      })
      return true
    }

    const productUrl = isNahdiProductUrl(url.searchParams.get('url') || '')
    if (!productUrl) {
      json(req, res, config, 400, {
        error: 'Only verified Nahdi product-page URLs can be previewed.',
      })
      return true
    }

    const cacheKey = productUrl.toString()
    const cached = productPreviewCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      json(req, res, config, 200, {
        ...(cached.imageUrl ? { image_url: cached.imageUrl } : {}),
        ...(cached.price ? { price: cached.price } : {}),
        ...(cached.rating ? { rating: cached.rating } : {}),
        ...(cached.ratingCount ? { rating_count: cached.ratingCount } : {}),
      })
      return true
    }
    if (cached) productPreviewCache.delete(cacheKey)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PRODUCT_PREVIEW_TIMEOUT_MS)
    try {
      const response = await fetchNahdiProductPage(productUrl, controller.signal)
      const contentType = response.headers.get('content-type') || ''
      const contentLength = Number(response.headers.get('content-length') || 0)
      if (!response.ok || !contentType.toLowerCase().includes('text/html')) {
        json(req, res, config, 502, { error: 'Unable to load the product page preview.' })
        return true
      }
      if (contentLength > PRODUCT_HTML_LIMIT) {
        json(req, res, config, 502, { error: 'The product page preview is too large to process.' })
        return true
      }

      const html = await response.text()
      if (html.length > PRODUCT_HTML_LIMIT) {
        json(req, res, config, 502, { error: 'The product page preview is too large to process.' })
        return true
      }
      const imageUrl = productImageFromHtml(html, productUrl)
      const metadata = extractProductPageMetadata(html)
      if (!imageUrl && !metadata.price && !metadata.rating) {
        json(req, res, config, 404, { error: 'No product preview data is available for this page.' })
        return true
      }

      if (productPreviewCache.size >= 200) {
        const oldestKey = productPreviewCache.keys().next().value
        if (oldestKey) productPreviewCache.delete(oldestKey)
      }
      productPreviewCache.set(cacheKey, {
        ...(imageUrl ? { imageUrl } : {}),
        ...metadata,
        expiresAt: Date.now() + PRODUCT_PREVIEW_CACHE_MS,
      })
      json(req, res, config, 200, {
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(metadata.price ? { price: metadata.price } : {}),
        ...(metadata.rating ? { rating: metadata.rating } : {}),
        ...(metadata.ratingCount ? { rating_count: metadata.ratingCount } : {}),
      })
    } catch (error) {
      const timedOut = error instanceof Error && error.name === 'AbortError'
      json(req, res, config, timedOut ? 504 : 502, {
        error: timedOut
          ? 'The product page preview timed out.'
          : 'Unable to read the product page preview.',
      })
    } finally {
      clearTimeout(timer)
    }
    return true
  }

  if (pathname === '/api/assistant/chat' && req.method === 'POST') {
    const limit = rateLimit({ key: `chat:${ip}`, limit: 20, windowMs: 60_000 })
    if (!limit.ok) {
      json(req, res, config, 429, { error: 'Too many chat requests. Please wait and try again.' }, {
        'Retry-After': String(limit.retryAfterSec),
      })
      return true
    }

    let body: unknown
    try {
      body = await readJsonBody(req)
    } catch (error) {
      json(req, res, config, 400, {
        error: error instanceof Error && error.message === 'payload_too_large' ? 'Request too large.' : 'Invalid JSON body.',
      })
      return true
    }

    const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const question = typeof record.question === 'string' ? record.question.trim() : ''
    const sessionId = typeof record.session_id === 'string' ? record.session_id.trim() : ''
    const temperature =
      typeof record.temperature === 'number' && Number.isFinite(record.temperature)
        ? Math.min(1.5, Math.max(0, record.temperature))
        : 0.7

    if (!question || question.length > MAX_QUESTION) {
      json(req, res, config, 400, { error: 'question must be 1–4000 characters.' })
      return true
    }
    if (!SESSION_ID_RE.test(sessionId)) {
      json(req, res, config, 400, { error: 'session_id is invalid.' })
      return true
    }

    try {
      const upstream = await idrakFetch(
        config,
        '/api/public/agents/ask',
        { question, session_id: sessionId, temperature },
        ASK_TIMEOUT_MS,
        config.chatApiKey,
      )

      if (!upstream.ok) {
        json(req, res, config, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502, {
          error: extractAskError(upstream.json, upstream.status),
        })
        return true
      }

      const answer = extractAskAnswer(upstream.json)
      if (!answer) {
        json(req, res, config, 502, {
          error: 'The assistant returned an empty answer.',
        })
        return true
      }

      json(req, res, config, 200, {
        ok: true,
        answer,
        session_id: sessionId,
        products: extractProducts(upstream.json),
      })
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      json(req, res, config, aborted ? 504 : 502, {
        error: aborted
          ? 'The assistant timed out. Please try again.'
          : 'Unable to reach the assistant right now.',
      })
    }
    return true
  }

  if (pathname === '/api/assistant/voice/session' && req.method === 'POST') {
    const limit = rateLimit({ key: `voice:${ip}`, limit: 6, windowMs: 60_000 })
    if (!limit.ok) {
      json(req, res, config, 429, { error: 'Too many voice session requests. Please wait and try again.' }, {
        'Retry-After': String(limit.retryAfterSec),
      })
      return true
    }

    let body: unknown
    try {
      body = await readJsonBody(req)
    } catch {
      json(req, res, config, 400, { error: 'Invalid JSON body.' })
      return true
    }

    const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const userId = typeof record.user_id === 'string' ? record.user_id.trim() : ''
    const sessionId = typeof record.session_id === 'string' ? record.session_id.trim() : ''
    const voiceId = record.voice_id

    if (!SESSION_ID_RE.test(userId) || !SESSION_ID_RE.test(sessionId)) {
      json(req, res, config, 400, { error: 'user_id and session_id are required.' })
      return true
    }
    if (voiceId !== 'female_01' && voiceId !== 'male_01') {
      json(req, res, config, 400, { error: 'voice_id must be female_01 or male_01.' })
      return true
    }

    try {
      const upstream = await realtimeTokenFetch(
        config,
        {
          session_id: sessionId,
          knowledgebase: 'nahdi',
          user_id: userId,
          room_name: `nahdi_${randomUUID()}`,
          participant_name: 'Nahdi Demo Visitor',
          language_mode: 'en',
          arabic_dialect: 'none',
          voice_id: voiceId,
          system_prompt:
            'You are Nahdi’s warm, knowledgeable skincare advisor speaking in a live voice conversation. As soon as the call connects, greet the visitor in one short sentence and invite them to share a skin concern or goal, then listen. Sound natural, calm, and polished. Keep replies concise by default (about 2–4 short sentences); expand only when asked. Never read markdown, bullet symbols, URLs, or formatting aloud. When giving a routine, guide the listener through a few steps in spoken order. When recommending a product, say its name, the relevant benefit, who it may suit, and one practical use tip, using only information available to you. Ask at most one brief follow-up question when it would help personalize the advice. Avoid repetition, unsupported claims, and medical diagnoses; suggest a dermatologist for persistent or serious concerns.',
          metadata_filters: {},
        },
      )

      if (!upstream.ok) {
        json(req, res, config, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502, {
          error: extractVoiceError(upstream.json, upstream.status),
        })
        return true
      }

      const credentials = extractLiveKitCredentials(upstream.json)
      if (!credentials) {
        json(req, res, config, 502, {
          error:
            'Voice session was created, but connection details were missing. Two-way audio cannot start.',
          audio_connected: false,
        })
        return true
      }

      json(req, res, config, 200, {
        ok: true,
        audio_connected: false,
        session_id: credentials.sessionId || sessionId,
        livekit: {
          url: credentials.url,
          token: credentials.token,
          room_name: credentials.roomName,
          participant_identity: credentials.participantIdentity,
          expires_in: credentials.expiresIn,
        },
      })
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError'
      json(req, res, config, aborted ? 504 : 502, {
        error: aborted
          ? 'Voice session timed out. Please try again.'
          : 'Unable to start a voice session right now.',
      })
    }
    return true
  }

  json(req, res, config, 404, { error: 'Not found.' })
  return true
}
