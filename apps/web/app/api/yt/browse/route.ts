import { NextResponse } from 'next/server';
import { getBrowse } from '@/lib/innertube/client';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const browseId = (url.searchParams.get('id') ?? 'FEwhat_to_watch').trim();
  const params = url.searchParams.get('params') ?? undefined;
  if (browseId.length === 0 || browseId.length > 64) {
    return NextResponse.json({ ok: false, reason: 'invalid id' }, { status: 400 });
  }
  if (typeof params === 'string' && params.length > 6000) {
    return NextResponse.json({ ok: false, reason: 'params too long' }, { status: 400 });
  }
  const result = await getBrowse(browseId, params);
  if (result.kind !== 'ok') {
    return NextResponse.json({ ok: false, reason: result.reason ?? 'unavailable' }, { status: 502 });
  }
  return NextResponse.json({
    ok: true,
    videos: result.videos,
    shorts: result.shorts,
    continuation: result.continuation,
    chips: result.chips ?? [],
    browseId,
  });
}
