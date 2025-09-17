import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Backend: preferuj service role (omija RLS) – BEZPIECZNIE, bo nie wychodzi z serwera
export const sb = createClient(url, service ?? anon, {
  auth: { persistSession: false },
});
