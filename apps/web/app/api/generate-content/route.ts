import { NextResponse } from 'next/server';
import { Video } from '@showcase/shared';
import { z } from 'zod';
import { anthropic, MODEL_HAIKU, appendLog, estimateCost } from '@/lib/anthropic';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 30;

const Body = z.object({
  category: z.string(),
  count: z.number().int().min(1).max(20).default(8),
  style: z.string().optional(),
  slug: z.string().default('youtube-clone'),
});

const VideoBatch = z.object({ videos: z.array(Video) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { category, count, style, slug } = parsed.data;

  const t0 = Date.now();
  const prompt = `Generate ${count} realistic YouTube videos in the category "${category}".${
    style ? ` Style guidance: ${style}.` : ''
  }

Return strict JSON matching this shape:
{
  "videos": [
    {
      "id": "stable-string-no-spaces",
      "title": "...",
      "channel": { "name": "...", "avatar": "https://i.pravatar.cc/80?u=channelname", "verified": true|false, "subscriberCount": <int> },
      "thumbnail": "https://images.unsplash.com/photo-...?w=640",
      "duration": "M:SS or H:MM:SS",
      "views": <int>,
      "postedAgo": "N days ago" | "N weeks ago" | "N months ago",
      "tags": ["tag1", "tag2", ...],
      "description": "1-3 sentences",
      "category": "${category}"
    }
  ]
}

Vary channel names. Use realistic durations (skewed long-tail). Tags should be discriminating (e.g., chill jazz video gets ['jazz', 'chill', 'instrumental', 'lofi']). Output ONLY the JSON, no commentary.`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL_HAIKU,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n');

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    const validated = VideoBatch.parse(json);

    // Drop entries whose thumbnail URL doesn't resolve, so we never store/show
    // hallucinated Unsplash IDs.
    const reachable = await Promise.all(
      validated.videos.map(async (v) => {
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 4000);
          const res = await fetch(v.thumbnail, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
          clearTimeout(t);
          return res.ok || res.status === 206;
        } catch {
          return false;
        }
      }),
    );
    const validVideos = validated.videos.filter((_, i) => reachable[i]);

    const db = supabaseAdmin();
    const { data: site } = await db.from('sites').select('id').eq('slug', slug).single();
    if (site && validVideos.length > 0) {
      await db.from('generated_videos').upsert(
        validVideos.map((v) => ({
          id: v.id,
          site_id: site.id,
          category: v.category,
          data: v,
        })),
        { onConflict: 'id' },
      );
    }

    const cost = estimateCost(MODEL_HAIKU, response.usage);
    await appendLog({
      ts: new Date().toISOString(),
      durationMs: Date.now() - t0,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: 0,
      cacheCreationTokens: 0,
      cacheHitRatio: 0,
      costUsd: cost,
      model: MODEL_HAIKU,
      toolUses: [{ name: 'generate-content', input: { category, count } }],
      stopReason: response.stop_reason,
    });

    return NextResponse.json({ videos: validVideos, costUsd: cost, dropped: validated.videos.length - validVideos.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
