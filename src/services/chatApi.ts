import type {
  ChatMessage,
  ProductLink,
  SendMessageResult,
  VoiceSessionResult,
} from '../types/chat'
import { getVisitorIds } from './session'

const PROXY_PREFIX = '/api/assistant'

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function sanitizeProducts(raw: ProductLink[] | undefined): ProductLink[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const seen = new Set<string>()
  const products: ProductLink[] = []
  for (const item of raw) {
    const url = typeof item?.url === 'string' ? item.url.trim() : ''
    const name = typeof item?.name === 'string' ? item.name.trim() : ''
    if (!url || !name || !isSafeHttpUrl(url) || seen.has(url)) continue
    seen.add(url)
    const imageUrl =
      typeof item.imageUrl === 'string' && isSafeHttpUrl(item.imageUrl)
        ? item.imageUrl
        : undefined
    products.push({ name, url, imageUrl })
  }
  return products.length ? products : undefined
}

export async function checkAssistantAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${PROXY_PREFIX}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) return false
    const data = (await response.json()) as { ok?: boolean; configured?: boolean }
    return Boolean(data.ok && data.configured)
  } catch {
    return false
  }
}

export type SendChatPayload = {
  message: string
  sessionId: string
  history: ChatMessage[]
  contextLabel?: string | null
}

export async function sendChatMessage(
  payload: SendChatPayload,
): Promise<SendMessageResult> {
  try {
    const response = await fetch(`${PROXY_PREFIX}/chat`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: payload.message,
        session_id: payload.sessionId,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(32000),
    })

    const data = (await response.json().catch(() => ({}))) as {
      answer?: string
      error?: string
      products?: ProductLink[]
    }

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.trim() || 'The assistant is unavailable right now. Please try again.',
      }
    }

    const content = data.answer?.trim()
    if (!content) {
      return { ok: false, error: 'The assistant returned an empty response.' }
    }

    return {
      ok: true,
      message: {
        id: createId('asst'),
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
        status: 'sent',
        products: sanitizeProducts(data.products),
      },
    }
  } catch {
    return {
      ok: false,
      error: 'Unable to reach the assistant service. Please try again shortly.',
    }
  }
}

export async function startVoiceSession(): Promise<VoiceSessionResult> {
  const ids = getVisitorIds()
  try {
    const response = await fetch(`${PROXY_PREFIX}/voice/session`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: ids.visitorId,
        session_id: ids.voiceSessionId,
      }),
      signal: AbortSignal.timeout(16000),
    })

    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean
      error?: string
      session_id?: string
      received_keys?: string[]
      livekit?: {
        url?: string
        token?: string
        room_name?: string | null
        participant_identity?: string | null
        expires_in?: number | null
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: data.error?.trim() || `Voice session failed (${response.status}).`,
        receivedKeys: data.received_keys,
      }
    }

    const livekit = data.livekit
    const url = livekit?.url?.trim()
    const token = livekit?.token?.trim()
    if (!livekit || !url || !token) {
      return {
        ok: false,
        error:
          'Voice session did not return LiveKit url and token. Audio cannot connect until those fields are present.',
        receivedKeys: data.received_keys,
      }
    }

    return {
      ok: true,
      sessionId: data.session_id || ids.voiceSessionId,
      livekit: {
        url,
        token,
        roomName: livekit.room_name ?? null,
        participantIdentity: livekit.participant_identity ?? null,
        expiresIn: livekit.expires_in ?? null,
      },
    }
  } catch {
    return {
      ok: false,
      error: 'Unable to start a voice call right now.',
    }
  }
}

export function createMessageId(role: 'user' | 'assistant' | 'system') {
  return createId(role)
}

export { getVisitorIds }
