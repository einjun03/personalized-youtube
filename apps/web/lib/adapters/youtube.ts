// YouTube adapter (post-Electron).
//
// SUPERSEDES the previous Electron+CDP sidecar implementation. This file used
// to be a localhost HTTP client to `apps/desktop`; it is now a thin wrapper
// around `lib/innertube` which:
//
//   1. reads YouTube cookies from the user's local Chrome cookie store
//      (lib/innertube/chrome-cookies.ts), and
//   2. drives `youtubei.js` against those cookies (lib/innertube/client.ts).
//
// The exported `FeedResult` discriminated union shape is preserved so
// `lib/queries/page.ts` keeps working unchanged. `getMore` was dropped — the
// new path walks continuations internally inside `getHomeFeed()` and returns
// a single 30+-video catalog.

import type { Video, Short } from '@showcase/shared';
import { getHomeFeed, type YtChip } from '../innertube/client';
import type { FeedAdapter } from './index';

export type FeedResult =
  | {
      kind: 'ok';
      videos: Video[];
      shorts: Short[];
      sections: unknown[];
      continuation: string | null;
      chips: YtChip[];
      capturedAt: number;
    }
  | { kind: 'unavailable'; reason: string };

export async function getFeed(): Promise<FeedResult> {
  const result = await getHomeFeed();
  if (result.kind === 'ok') {
    return {
      kind: 'ok',
      videos: result.videos,
      shorts: result.shorts,
      sections: [],
      capturedAt: Date.now(),
      continuation: result.continuation,
      chips: result.chips,
    };
  }
  return { kind: 'unavailable', reason: result.reason };
}

// FeedAdapter contract. The selector in `adapters/index.ts` only forwards
// `kind === 'ok'` to this method's resolved value; everything else (which we
// throw here) is caught by the selector and falls back to mock.
export const youtubeAdapter: FeedAdapter = {
  async getFeed() {
    const result = await getFeed();
    if (result.kind === 'ok') {
      return { videos: result.videos, categories: [] };
    }
    throw new Error(`youtube adapter unavailable: ${result.reason}`);
  },
};
