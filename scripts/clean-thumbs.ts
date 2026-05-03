/**
 * One-shot: scan the existing catalog (videos.json + generated_videos table) and
 * drop entries whose thumbnail URLs don't resolve. Re-runs patch-base-config
 * afterward so the live page reflects the cleaned set.
 *
 * Run: pnpm clean-thumbs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Video } from '@showcase/shared';
import { dropBrokenThumbs } from './_validate-thumbs';

const SITE_SLUG = 'youtube-clone';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase env missing');
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. Clean the on-disk mock catalog.
  const catalogPath = resolve(__dirname, '../apps/web/lib/mock-data/videos.json');
  const raw = await readFile(catalogPath, 'utf-8');
  const catalog = JSON.parse(raw) as { videos: Video[]; categories: string[] };
  console.log(`Validating ${catalog.videos.length} thumbnails in videos.json...`);
  const cleaned = await dropBrokenThumbs(catalog.videos);
  console.log(`  ${cleaned.length} kept (${catalog.videos.length - cleaned.length} dropped)`);
  await writeFile(catalogPath, JSON.stringify({ videos: cleaned, categories: catalog.categories }, null, 2));

  // 2. Clean the generated_videos table.
  const { data: site } = await db.from('sites').select('id, base_config').eq('slug', SITE_SLUG).single();
  if (!site) throw new Error('site not found');

  const { data: generated } = await db
    .from('generated_videos')
    .select('id, data')
    .eq('site_id', site.id);
  const genVideos = (generated ?? []).map((r) => r.data as Video);
  console.log(`Validating ${genVideos.length} generated_videos rows...`);
  const cleanedGen = await dropBrokenThumbs(genVideos);
  console.log(`  ${cleanedGen.length} kept (${genVideos.length - cleanedGen.length} dropped)`);

  const cleanedIds = new Set(cleanedGen.map((v) => v.id));
  const toDelete = (generated ?? [])
    .filter((r) => !cleanedIds.has(r.id))
    .map((r) => r.id);
  if (toDelete.length > 0) {
    await db.from('generated_videos').delete().in('id', toDelete);
    console.log(`Deleted ${toDelete.length} broken-thumbnail rows from generated_videos`);
  }

  // 3. Update base_config's VideoGrid + RecommendedRow + ContinueWatchingRow
  //    to use only cleaned videos.
  type BaseConfig = { sections: Array<{ id: string; type: string; props: Record<string, unknown> }> };
  const base = site.base_config as BaseConfig;
  const cleanedById = new Map(cleaned.map((v) => [v.id, v]));

  const updatedSections = base.sections.map((s) => {
    if (s.type === 'VideoGrid' || s.type === 'RecommendedRow' || s.type === 'ContinueWatchingRow') {
      const vids = (s.props.videos as Video[] | undefined) ?? [];
      const kept = vids.filter((v) => cleanedById.has(v.id));
      return { ...s, props: { ...s.props, videos: kept } };
    }
    if (s.type === 'ShortsRow') {
      const shorts = (s.props.shorts as Array<{ id: string }> | undefined) ?? [];
      // Shorts derived their ids as `short-${videoId}`; check the underlying video
      const kept = shorts.filter((sh) => cleanedById.has(sh.id.replace(/^short-/, '')));
      return { ...s, props: { ...s.props, shorts: kept } };
    }
    return s;
  });

  await db
    .from('sites')
    .update({ base_config: { ...base, sections: updatedSections }, updated_at: new Date().toISOString() })
    .eq('slug', SITE_SLUG);
  console.log(`Updated base_config: VideoGrid/RecommendedRow/ContinueWatchingRow/ShortsRow filtered to working thumbnails`);
}

main().catch((e) => { console.error(e); process.exit(1); });
