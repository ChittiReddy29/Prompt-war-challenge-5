/**
 * Tiny in-memory TTL cache for validated AI results. Identical requests (same endpoint, same
 * validated input) within the TTL are served without another model call.
 */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/** Maximum cached response entries retained per serverless instance. */
export const CACHE_MAX_ENTRIES = 200;

const store = new Map<string, { value: unknown; expires: number }>();

/** Generates a deterministic cache key from route and normalized request parameters. */
export function cacheKey(route: string, input: unknown): string {
  return `${route}:${JSON.stringify(input)}`;
}

/** Retrieves a non-expired cached result value by key. */
export function cacheGet(key: string, now: number = Date.now()): unknown {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires <= now) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

/** Stores a validated response payload with TTL expiration. */
export function cacheSet(key: string, value: unknown, now: number = Date.now()): void {
  if (store.size >= CACHE_MAX_ENTRIES) {
    // Maps keep insertion order, so the first key is the oldest entry.
    for (const oldest of store.keys()) {
      store.delete(oldest);
      break;
    }
  }
  store.set(key, { value, expires: now + CACHE_TTL_MS });
}

/** Flushes all in-memory cache entries (used between tests). */
export function clearCache(): void {
  store.clear();
}
