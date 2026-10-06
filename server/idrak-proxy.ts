import type { IncomingMessage, ServerResponse } from 'node:http'
import { isConfigured, type IdrakConfig } from './idrak-config.ts'
import {
  extractAskAnswer,
  extractAskError,
  extractLiveKitCredentials,
  extractProducts,
  extractVoiceError,
} from './parse-idrak.ts'
import { rateLimit } from './rate-limit.ts'

const ASK_TIMEOUT_MS = 30_000
const VOICE_TIMEOUT_MS = 15_000
const MAX_QUESTION = 4000
const SESSION_ID_RE = /^[A-Za-z0-9:_-]{1,128}$/

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
): Promise<{ status: number; json: unknown; ok: boolean }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
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
      ok: isConfigured(config),
      configured: isConfigured(config),
    })
    return true
  }

  if (!isConfigured(config)) {
    json(req, res, config, 503, {
      error: 'The assistant is temporarily unavailable. Please try again later.',
    })
    return true
  }

  const ip = clientIp(req)

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

    if (!SESSION_ID_RE.test(userId) || !SESSION_ID_RE.test(sessionId)) {
      json(req, res, config, 400, { error: 'user_id and session_id are required.' })
      return true
    }

    const agentId = encodeURIComponent(config.agentId)

    try {
      const upstream = await idrakFetch(
        config,
        `/api/public/agents/${agentId}/voice/session`,
        {
          agentId: config.agentId,
          user_id: userId,
          session_id: sessionId,
          language_mode: 'en',
          dialect: 'en_us',
          voice_id: 'female_01',
        },
        VOICE_TIMEOUT_MS,
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
