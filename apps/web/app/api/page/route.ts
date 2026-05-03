import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRenderedConfig } from '@/lib/queries/page';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? 'youtube-clone';
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitor_id')?.value;

  try {
    const config = await getRenderedConfig({ slug, visitorId });
    return NextResponse.json({ config });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
