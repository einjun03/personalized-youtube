// Server-side cache for the YouTube home feed.
//
// Without this, every page reload calls youtubei.js cold — that's a fresh
// /browse call to YouTube + parse. Wall-clock cost: 4–10s on a warm cookie
// jar, longer when the keychain prompt is involved. With this cache, repeat
// reloads land in <50ms.
//
// All visitors of this server share the same cached entry because the
// underlying Chrome cookies belong to the *server's machine*, not the
// visitor — so all visitors see the same logged-in account's feed anyway.
// Cache key is therefore a single 'home' constant; we don't key by visitor.
//
// 10-minute TTL is short enough that re-clicking "Home" or refreshing
// doesn't show stale data for long; long enough that page reloads during
// a demo session stay fast.
//
// Invalidation: `clearHomeFeedCache()` is called by the cookie loader on
// failure, and exposed for callers that want a forced refresh.

import type { HomeFeedResult } from './client';

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const KEY = 'home';

interface CacheEntry {
  result: HomeFeedResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedHomeFeed(): HomeFeedResult | null {
  const e = cache.get(KEY);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(KEY);
    return null;
  }
  return e.result;
}

export function setCachedHomeFeed(result: HomeFeedResult): void {
  // Only cache successful fetches — we don't want to memoize a transient
  // 'unavailable' so the next request re-tries with fresh state.
  if (result.kind !== 'ok') return;
  cache.set(KEY, { result, expiresAt: Date.now() + TTL_MS });
}

export function clearHomeFeedCache(): void {
  cache.delete(KEY);
}
