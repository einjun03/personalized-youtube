import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Video } from '@showcase/shared';
import type { FeedAdapter } from './index';

let cache: { videos: Video[]; categories: string[] } | null = null;

async function loadCatalog() {
  if (cache) return cache;
  const path = join(process.cwd(), 'lib/mock-data/videos.json');
  const raw = await readFile(path, 'utf-8');
  const data = JSON.parse(raw) as { videos: Video[]; categories: string[] };
  cache = data;
  return cache;
}

export const mockAdapter: FeedAdapter = {
  async getFeed() {
    return loadCatalog();
  },
};

export function clearMockCache() {
  cache = null;
}
