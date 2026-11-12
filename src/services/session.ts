import { SESSION_STORAGE_KEY, VISITOR_STORAGE_KEY } from '../types/chat'

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function readOrCreate(key: string, factory: () => string): string {
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing
    const created = factory()
    sessionStorage.setItem(key, created)
    return created
  } catch {
    return factory()
  }
}

export function getVisitorIds() {
  const stamp = readOrCreate(VISITOR_STORAGE_KEY, randomId)
  const visitorId = readOrCreate(SESSION_STORAGE_KEY, () => `visitor-${stamp}`)
  return {
    visitorId,
    voiceSessionId: `voice-${stamp}`,
  }
}

export function resetVisitorIds() {
  const stamp = randomId()
  const ids = {
    visitorId: `visitor-${stamp}`,
    voiceSessionId: `voice-${stamp}`,
  }

  try {
    sessionStorage.setItem(VISITOR_STORAGE_KEY, stamp)
    sessionStorage.setItem(SESSION_STORAGE_KEY, ids.visitorId)
  } catch {
    return ids
  }

  return ids
}
