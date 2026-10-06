type Bucket = number[]

const buckets = new Map<string, Bucket>()

export function rateLimit(args: {
  key: string
  limit: number
  windowMs: number
}): { ok: true; remaining: number; resetMs: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now()
  const windowStart = now - args.windowMs
  const previous = buckets.get(args.key) ?? []
  const recent = previous.filter((ts) => ts > windowStart)

  if (recent.length >= args.limit) {
    const retryAfterMs = (recent[0] ?? now) + args.windowMs - now
    buckets.set(args.key, recent)
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) }
  }

  recent.push(now)
  buckets.set(args.key, recent)
  const oldest = recent[0] ?? now
  return {
    ok: true,
    remaining: args.limit - recent.length,
    resetMs: oldest + args.windowMs,
  }
}
