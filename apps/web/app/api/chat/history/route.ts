import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') ?? 'youtube-clone';
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10) || 30, 100);

  const cookieStore = await cookies();
  const visitorId = cookieStore.get('visitor_id')?.value;
  if (!visitorId) return NextResponse.json({ messages: [] });

  const db = supabaseAdmin();
  const { data: site } = await db.from('sites').select('id').eq('slug', slug).single();
  if (!site) return NextResponse.json({ messages: [] });

  const { data: turns } = await db
    .from('chat_turns')
    .select('user_message, assistant_message, tool_uses, created_at')
    .eq('visitor_id', visitorId)
    .eq('site_id', site.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  // Flatten oldest-first into a single message stream the UI can render.
  const ordered = (turns ?? []).slice().reverse();
  const messages: Array<{ role: 'user' | 'assistant'; content: string; toolUses?: Array<{ name: string }> }> = [];
  for (const t of ordered) {
    messages.push({ role: 'user', content: t.user_message });
    const toolUses = Array.isArray(t.tool_uses)
      ? (t.tool_uses as Array<{ name: string }>).map((u) => ({ name: u.name }))
      : undefined;
    if (t.assistant_message || (toolUses && toolUses.length > 0)) {
      messages.push({
        role: 'assistant',
        content: t.assistant_message ?? '',
        ...(toolUses && toolUses.length > 0 ? { toolUses } : {}),
      });
    }
  }

  return NextResponse.json({ messages });
}
