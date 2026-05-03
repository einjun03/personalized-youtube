/**
 * Seed script — generates the 300-video mock catalog and inserts the base
 * PageConfig row for the youtube-clone site. Idempotent: re-running upserts.
 *
 * Run: pnpm seed
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { Video, PageConfigSchema, type PageConfig } from '@showcase/shared';
import { dropBrokenThumbs } from './_validate-thumbs';

const SITE_SLUG = 'youtube-clone';
const TARGET_COUNT_PER_CATEGORY = 10;
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

const CATEGORIES: Array<{ id: string; label: string; tags: string[] }> = [
  { id: 'music-jazz', label: 'Jazz', tags: ['music', 'jazz'] },
  { id: 'music-classical', label: 'Classical', tags: ['music', 'classical'] },
  { id: 'music-chill', label: 'Chill', tags: ['music', 'chill', 'lofi', 'instrumental'] },
  { id: 'music-hiphop', label: 'Hip-hop', tags: ['music', 'hip-hop'] },
  { id: 'music-rock', label: 'Rock', tags: ['music', 'rock'] },
  { id: 'music-electronic', label: 'Electronic', tags: ['music', 'electronic'] },
  { id: 'music-indie', label: 'Indie', tags: ['music', 'indie'] },
  { id: 'gaming', label: 'Gaming', tags: ['gaming'] },
  { id: 'cooking', label: 'Cooking', tags: ['cooking', 'tutorial'] },
  { id: 'tech-reviews', label: 'Tech reviews', tags: ['tech', 'review'] },
  { id: 'news', label: 'News', tags: ['news'] },
  { id: 'education', label: 'Education', tags: ['education', 'tutorial'] },
  { id: 'comedy', label: 'Comedy', tags: ['comedy'] },
  { id: 'fitness', label: 'Fitness', tags: ['fitness'] },
  { id: 'vlogs', label: 'Vlogs', tags: ['vlog'] },
  { id: 'sports', label: 'Sports highlights', tags: ['sports'] },
  { id: 'science', label: 'Science', tags: ['science', 'education'] },
  { id: 'history', label: 'History', tags: ['history'] },
  { id: 'kids', label: 'Kids', tags: ['kids'] },
  { id: 'beauty', label: 'Beauty', tags: ['beauty'] },
  { id: 'travel', label: 'Travel', tags: ['travel'] },
  { id: 'diy', label: 'DIY', tags: ['diy'] },
  { id: 'business', label: 'Business', tags: ['business', 'finance'] },
  { id: 'true-crime', label: 'True crime', tags: ['true-crime'] },
  { id: 'climbing', label: 'Climbing', tags: ['climbing', 'sports'] },
  { id: 'woodworking', label: 'Woodworking', tags: ['woodworking', 'diy'] },
  { id: 'fashion', label: 'Fashion', tags: ['fashion'] },
  { id: 'photography', label: 'Photography', tags: ['photography'] },
  { id: 'cars', label: 'Cars', tags: ['cars'] },
  { id: 'language', label: 'Language learning', tags: ['language', 'education'] },
];

const VideoBatch = z.object({ videos: z.array(Video) });

async function generateBatch(client: Anthropic, category: typeof CATEGORIES[number], count: number) {
  const prompt = `Generate ${count} realistic YouTube videos in the category "${category.label}". Tags must include at least: ${JSON.stringify(category.tags)}. Vary channel names. Realistic long-tail durations and view counts.

Return strict JSON only:
{
  "videos": [
    { "id": "${category.id}-1", "title": "...", "channel": { "name": "...", "avatar": "https://i.pravatar.cc/80?u=...", "verified": true|false, "subscriberCount": <int> }, "thumbnail": "https://images.unsplash.com/photo-XXXX?w=640&q=80", "duration": "M:SS", "views": <int>, "postedAgo": "...", "tags": [...], "description": "...", "category": "${category.id}" }
  ]
}`;

  const res = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = res.content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const parsed = VideoBatch.parse(JSON.parse(text.slice(start, end + 1)));
  return parsed.videos;
}

function makeBaseConfig(videos: Video[]): PageConfig {
  const config: PageConfig = {
    id: 'youtube-clone',
    slug: SITE_SLUG,
    theme: {
      mode: 'light',
      accent: '#FF0000',
      fontScale: '1',
      radius: 'md',
      videoCardDefaults: {
        aspectRatio: '16:9',
        thumbnailScale: 1,
        titleWeight: 500,
        channelNameWeight: 400,
        showDescription: false,
        showViewCount: true,
        showPostedAgo: true,
        showDuration: true,
      },
    },
    sections: [
      {
        id: 'topBar',
        type: 'TopBar',
        props: {
          logoText: 'YouTube',
          searchPlaceholder: 'Search',
          compactSearch: false,
          showProfileChip: true,
        },
      },
      {
        id: 'sidebar',
        type: 'Sidebar',
        props: {
          collapsed: false,
          pinnedItems: ['Home', 'Shorts', 'Subscriptions', 'You'],
          showSubscriptions: true,
        },
      },
      {
        id: 'categoryChips',
        type: 'CategoryChips',
        props: {
          active: 'All',
          chips: ['All', 'Music', 'Gaming', 'Live', 'News', 'Cooking', 'Comedy', 'Recently uploaded'],
        },
      },
      {
        id: 'videoGrid',
        type: 'VideoGrid',
        props: { columns: 4, density: 'cozy', videos: videos.slice(0, 60) },
      },
    ],
    filter: { include: [], exclude: [], requireTags: [], blockChannels: [] },
    sort: { by: 'recommended', order: 'desc' },
    meta: { title: 'YouTube', favicon: '/favicon.ico' },
  };
  return PageConfigSchema.parse(config);
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY missing');
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase env vars missing');

  const client = new Anthropic({ apiKey });
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  console.log(`Generating ${TARGET_COUNT_PER_CATEGORY} videos × ${CATEGORIES.length} categories...`);
  const allVideos: Video[] = [];
  for (const cat of CATEGORIES) {
    process.stdout.write(`  ${cat.label}... `);
    try {
      const batch = await generateBatch(client, cat, TARGET_COUNT_PER_CATEGORY);
      const valid = await dropBrokenThumbs(batch);
      allVideos.push(...valid);
      const dropped = batch.length - valid.length;
      console.log(`${valid.length} kept${dropped ? ` (${dropped} dropped: bad thumbnail)` : ''}`);
    } catch (e) {
      console.log(`failed: ${(e as Error).message}`);
    }
  }
  console.log(`Total: ${allVideos.length} videos`);

  const catalogPath = resolve(__dirname, '../apps/web/lib/mock-data/videos.json');
  await mkdir(dirname(catalogPath), { recursive: true });
  await writeFile(catalogPath, JSON.stringify({ videos: allVideos, categories: CATEGORIES.map((c) => c.label) }, null, 2));
  console.log(`Wrote catalog to ${catalogPath}`);

  const baseConfig = makeBaseConfig(allVideos);
  await db.from('sites').upsert(
    { slug: SITE_SLUG, base_config: baseConfig, updated_at: new Date().toISOString() },
    { onConflict: 'slug' },
  );
  console.log(`Upserted site row for slug=${SITE_SLUG}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
