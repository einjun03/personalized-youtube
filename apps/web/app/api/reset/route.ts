import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? 'youtube-clone';
  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitor_id')?.value;
  if (!visitorId) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const db = supabaseAdmin();
  const { data: site } = await db.from('sites').select('id').eq('slug', slug).single();
  if (!site) return NextResponse.json({ ok: true, deleted: 0 });

  const { count } = await db
    .from('preferences')
    .delete({ count: 'exact' })
    .eq('visitor_id', visitorId)
    .eq('site_id', site.id);

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
