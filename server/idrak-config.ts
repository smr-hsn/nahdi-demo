export type IdrakEnv = {
  IDRAK_BASE_URL?: string
  IDRAK_API_KEY?: string
  IDRAK_CHAT_API_KEY?: string
  IDRAK_ALLOWED_ORIGINS?: string
  REALTIME_TOKEN_API_KEY?: string
  VOICE_SERVER_API_KEY?: string
  VOICE_TOKEN_BASE_URL?: string
  VOICE_SERVER_BASE_URL?: string
}

export type IdrakConfig = {
  baseUrl: string
  apiKey: string
  chatApiKey: string
  realtimeTokenApiKey: string
  voiceTokenBaseUrl: string
  allowedOrigins: string[]
}

const DEFAULT_BASE_URL = 'https://idrak.bilyticaglobal.com'
const DEFAULT_VOICE_TOKEN_BASE_URL = 'https://voice-realtime.bilyticaglobal.com'

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function readIdrakConfig(env: IdrakEnv): IdrakConfig {
  const baseUrl = (env.IDRAK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  const apiKey = (env.IDRAK_API_KEY || '').trim()
  const chatApiKey = (env.IDRAK_CHAT_API_KEY || apiKey).trim()
  const realtimeTokenApiKey =
    (env.REALTIME_TOKEN_API_KEY || '').trim() ||
    (env.VOICE_SERVER_API_KEY || '').trim()
  const voiceTokenBaseUrl = normalizeBaseUrl(
    (env.VOICE_TOKEN_BASE_URL || '').trim() ||
      (env.VOICE_SERVER_BASE_URL || '').trim() ||
      DEFAULT_VOICE_TOKEN_BASE_URL,
  )
  const allowedOrigins = (env.IDRAK_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return {
    baseUrl,
    apiKey,
    chatApiKey,
    realtimeTokenApiKey,
    voiceTokenBaseUrl,
    allowedOrigins,
  }
}

export function isChatConfigured(config: IdrakConfig): boolean {
  return Boolean(config.chatApiKey && config.baseUrl)
}

export function isVoiceConfigured(config: IdrakConfig): boolean {
  return Boolean(config.realtimeTokenApiKey && config.voiceTokenBaseUrl)
}
