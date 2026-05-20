/**
 * lib/rate-limit.ts
 * Simple in-memory rate limiter for login endpoints.
 * Resets on server restart — suitable for single-instance deploys.
 */

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

interface Options {
  maxAttempts: number   // max tries in the window
  windowMs:    number   // window size in ms
}

export function checkRateLimit(key: string, opts: Options): { allowed: boolean; remaining: number } {
  const now = Date.now()
  pruneExpired(now)

  let bucket = store.get(key)

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + opts.windowMs }
    store.set(key, bucket)
  }

  bucket.count++
  const remaining = Math.max(0, opts.maxAttempts - bucket.count)
  return { allowed: bucket.count <= opts.maxAttempts, remaining }
}

function pruneExpired(now: number) {
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key)
  }
}
