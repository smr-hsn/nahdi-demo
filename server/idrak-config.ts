export type IdrakEnv = {
  IDRAK_BASE_URL?: string
  IDRAK_API_KEY?: string
  IDRAK_AGENT_ID?: string
  IDRAK_ALLOWED_ORIGINS?: string
}

export type IdrakConfig = {
  baseUrl: string
  apiKey: string
  agentId: string
  allowedOrigins: string[]
}

const DEFAULT_BASE_URL = 'https://idrak.bilyticaglobal.com'
const DEFAULT_AGENT_ID = 'agt-1791273705542-awzfqk'

export function readIdrakConfig(env: IdrakEnv): IdrakConfig {
  const baseUrl = (env.IDRAK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '')
  const apiKey = (env.IDRAK_API_KEY || '').trim()
  const agentId = (env.IDRAK_AGENT_ID || DEFAULT_AGENT_ID).trim()
  const allowedOrigins = (env.IDRAK_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return { baseUrl, apiKey, agentId, allowedOrigins }
}

export function isConfigured(config: IdrakConfig): boolean {
  return Boolean(config.apiKey && config.baseUrl && config.agentId)
}
