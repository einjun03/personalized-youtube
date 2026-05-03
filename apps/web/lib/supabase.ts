import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});

export const supabaseAdmin = () => {
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — set in .env.local');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
};
