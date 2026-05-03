import { z } from 'zod';

export const Channel = z.object({
  name: z.string(),
  avatar: z.string().url().or(z.string()),
  verified: z.boolean().default(false),
  subscriberCount: z.number().int().nonnegative().default(0),
});
export type Channel = z.infer<typeof Channel>;

// Chapter-segment metadata for chapter-aware playback control (skip sponsor /
// intro / outro, "loop the cool part", "show me only the conclusion"). We
// don't fetch SponsorBlock data live — the field is opt-in and either set on
// seed or by the LLM via a chapter-source adapter. `kind` is open-ended so
// new tag categories (recap, self-promo, ad-read, q&a) can flow in over time.
export const Chapter = z.object({
  kind: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
  label: z.string().default(''),
});
export type Chapter = z.infer<typeof Chapter>;

export const Video = z.object({
  id: z.string(),
  title: z.string(),
  channel: Channel,
  thumbnail: z.string(),
  duration: z.string(),
  views: z.number().int().nonnegative(),
  postedAgo: z.string(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(''),
  category: z.string(),
  // Per-video computed metadata. Optional so existing fixtures and live
  // youtubei.js mappings don't break — sections that need these (MoodBoard,
  // density sort, watched filter) compute defaults on the fly when missing.
  mood: z.string().optional(),
  // Topical-density score: roughly unique_topic_tags / runtime_minutes,
  // normalized. Higher = denser deep-dive; lower = scrolly entertainment.
  density: z.number().nonnegative().optional(),
  chapters: z.array(Chapter).default([]).optional(),
  // Visitor-scoped watched flag (computed server-side per visitor cookie or
  // baked into the seed for static demos).
  watched: z.boolean().optional(),
});
export type Video = z.infer<typeof Video>;

export const Short = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  views: z.number().int().nonnegative(),
  channel: Channel,
});
export type Short = z.infer<typeof Short>;
