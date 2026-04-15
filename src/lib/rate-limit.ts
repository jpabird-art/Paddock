/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments. For multi-instance,
 * replace with Redis-backed storage.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}, 300_000).unref?.();

/**
 * Check if a request is within the rate limit.
 * @param key   Unique identifier (e.g. IP address)
 * @param limit Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 * @returns { allowed, remaining, retryAfterMs }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldest + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    retryAfterMs: 0,
  };
}
