'use client';

// MoodBoard — replaces VideoGrid when the visitor wants the feed grouped by
// vibe. The classifier is content-only: a video lands in a mood when any of
// its tags appear in the mood's tag list, OR when the video has Video.mood
// set explicitly. This means any prompt asking for mood-grouping (the
// designed scenario, "decompress" buckets, "deep-dive" buckets, anything)
// works because the LLM only has to set the mood list — classification is
// automatic.

import type { PageConfig, Section, Video } from '@showcase/shared';
import { VideoCard } from './VideoCard';

function parseDuration(s: string): number {
  if (!s || typeof s !== 'string') return 0;
  const parts = s.split(':').map(Number);
  if (parts.length === 2) return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  return 0;
}

const MOOD_BLOCK_TINTS: Record<string, { border: string; bg: string }> = {
  focus:    { border: 'rgba(110, 180, 255, 0.35)', bg: 'rgba(110,180,255,0.06)' },
  winddown: { border: 'rgba(255, 180, 130, 0.35)', bg: 'rgba(255,180,130,0.06)' },
  sharpen:  { border: 'rgba(180, 130, 255, 0.35)', bg: 'rgba(180,130,255,0.06)' },
  curious:  { border: 'rgba(255, 220, 100, 0.30)', bg: 'rgba(255,220,100,0.06)' },
};
function tintFor(id: string) {
  return MOOD_BLOCK_TINTS[id] ?? { border: 'var(--border)', bg: 'transparent' };
}

// Defensive defaults for sections that Claude can spawn via add_section
// (which builds the section directly, without running Zod defaults).
const DEFAULT_MOODS = [
  { id: 'focus',    label: 'Focus',     emoji: '◐', description: 'Long-form, single-topic, low-energy.', tags: ['lofi', 'focus', 'documentary', 'engineering', 'deep'] },
  { id: 'winddown', label: 'Wind down', emoji: '◌', description: 'Calm pacing, friendly voices.',         tags: ['slow', 'calm', 'asmr', 'sleep', 'vlog'] },
  { id: 'sharpen',  label: 'Sharpen',   emoji: '◉', description: 'Argued, longer than 30 min.',           tags: ['philosophy', 'debate', 'analysis', 'longform'] },
  { id: 'curious',  label: 'Curious',   emoji: '✦', description: 'Random rabbit holes.',                  tags: ['mahjong', 'craft', 'culture', 'games'] },
];

export function MoodBoard({ section, config }: { section: Section; config: PageConfig }) {
  if (section.type !== 'MoodBoard') return null;
  const props = section.props as Partial<{ moods: typeof DEFAULT_MOODS; densityPerMood: Record<string, 'compact' | 'cozy' | 'comfortable'>; videos: Video[] }>;
  const moods = Array.isArray(props.moods) && props.moods.length > 0 ? props.moods : DEFAULT_MOODS;
  const densityPerMood = props.densityPerMood ?? {};
  const ownVideos: Video[] = Array.isArray(props.videos) ? props.videos : [];

  // Pull videos from anywhere we can find them. Prefer this section's own
  // list, then VideoGrid (the standard home feed), then aggregate the row
  // sections (ContinueWatchingRow, RecommendedRow) so MoodBoard still has
  // content even after a `remove_section videoGrid` patch.
  function collectFromSections(): Video[] {
    if (ownVideos.length > 0) return ownVideos;
    const seen = new Set<string>();
    const out: Video[] = [];
    for (const s of config.sections) {
      if (s.type === 'VideoGrid' || s.type === 'RecommendedRow' || s.type === 'ContinueWatchingRow') {
        const vids = (s.props as { videos?: Video[] }).videos ?? [];
        for (const v of vids) {
          if (!seen.has(v.id)) {
            seen.add(v.id);
            out.push(v);
          }
        }
      }
    }
    return out;
  }
  const fallback = collectFromSections();

  // Multi-pass classifier — robust across data sources where tags may be
  // empty (the youtubei.js adapter ships videos with `tags: []`):
  //   1. explicit Video.mood match
  //   2. tag overlap (when tags exist)
  //   3. title / channel / description keyword overlap (always available)
  //   4. duration heuristic (focus/sharpen prefer long videos)
  //   5. round-robin distribution of any remaining videos so no mood is empty
  function score(v: Video, moodId: string, moodTags: string[]): number {
    if (typeof v.mood === 'string' && v.mood === moodId) return 100;
    let s = 0;
    const tagsLower = (Array.isArray(v.tags) ? v.tags : []).map((t) => t.toLowerCase());
    for (const t of moodTags) {
      if (tagsLower.includes(t)) s += 10;
    }
    const haystack = `${v.title} ${v.channel?.name ?? ''} ${v.description ?? ''}`.toLowerCase();
    for (const t of moodTags) {
      if (t.length >= 3 && haystack.includes(t)) s += 3;
    }
    // Soft duration bias: focus/sharpen prefer >= 20 min; winddown is neutral.
    const secs = parseDuration(v.duration);
    if ((moodId === 'focus' || moodId === 'sharpen') && secs >= 20 * 60) s += 1;
    if (moodId === 'winddown' && secs <= 30 * 60) s += 0.5;
    return s;
  }

  // First pass: best-mood-by-score for each video.
  const buckets: Record<string, Video[]> = Object.fromEntries(moods.map((m) => [m.id, [] as Video[]]));
  const unbucketed: Video[] = [];
  for (const v of fallback) {
    let bestMoodId: string | null = null;
    let bestScore = 0;
    for (const m of moods) {
      const sc = score(v, m.id, (m.tags ?? []).map((t) => t.toLowerCase()));
      if (sc > bestScore) {
        bestScore = sc;
        bestMoodId = m.id;
      }
    }
    if (bestMoodId !== null) {
      const arr = buckets[bestMoodId];
      if (arr) arr.push(v);
    } else {
      unbucketed.push(v);
    }
  }
  // Round-robin the unbucketed videos so every mood has at least something
  // (so the page reads as "grouped by mood" even when tag data is absent).
  for (let i = 0; i < unbucketed.length; i++) {
    const moodId = moods[i % moods.length]?.id;
    if (!moodId) break;
    const arr = buckets[moodId];
    if (arr) {
      const item = unbucketed[i];
      if (item) arr.push(item);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-3">
      {moods.map((m) => {
        const items = buckets[m.id] ?? [];
        if (items.length === 0) return null;
        const tint = tintFor(m.id);
        const dens = densityPerMood?.[m.id] ?? null;
        const cols = dens === 'compact' ? 5 : dens === 'comfortable' ? 3 : 4;
        return (
          <section
            key={m.id}
            className="rounded-2xl border p-4"
            style={{ borderColor: tint.border, background: `linear-gradient(180deg, ${tint.bg}, transparent)` }}
          >
            <header className="mb-3 flex items-baseline gap-3">
              <span className="text-2xl leading-none" aria-hidden>{m.emoji}</span>
              <div>
                <h2 className="text-base font-semibold">{m.label}</h2>
                {m.description && (
                  <p className="text-xs text-[color:var(--muted-fg)]">{m.description}</p>
                )}
              </div>
              <span className="ml-auto text-xs text-[color:var(--muted-fg)]">{items.length} videos</span>
            </header>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols >= 5 ? 160 : 200}px, 1fr))` }}
            >
              {items.slice(0, 6).map((v) => (
                <VideoCard key={v.id} video={v} config={config} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
