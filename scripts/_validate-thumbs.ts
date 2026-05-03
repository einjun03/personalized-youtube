/**
 * HEAD-validates thumbnail URLs and drops items whose thumbnails 404 / time out.
 * Used by seed.ts, scripts/clean-thumbs.ts, and api/generate-content.
 */

const TIMEOUT_MS = 4000;
const CONCURRENCY = 8;

async function isReachable(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    // Some CDNs reject HEAD; try HEAD first, fall back to a 1-byte GET.
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok && res.status === 405) {
      res = await fetch(url, {
        method: 'GET',
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { Range: 'bytes=0-0' },
      });
    }
    clearTimeout(timer);
    return res.ok || res.status === 206;
  } catch {
    return false;
  }
}

export async function dropBrokenThumbs<T extends { thumbnail: string }>(
  items: T[],
): Promise<T[]> {
  // Run in chunks of CONCURRENCY to avoid hammering CDNs.
  const out: T[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const chunk = items.slice(i, i + CONCURRENCY);
    const checks = await Promise.all(chunk.map((it) => isReachable(it.thumbnail)));
    chunk.forEach((it, j) => {
      if (checks[j]) out.push(it);
    });
  }
  return out;
}
