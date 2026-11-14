import { createBrowserClient } from '@supabase/ssr';

/**
 * The browser Supabase client.
 *
 * It uses the publishable anon key and the user's session, so every query it
 * makes goes through row level security. There is no service-role key in this
 * file, and there never will be.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. See .env.example.',
  );
}

/**
 * The browser client.
 *
 * The Supabase client is created once per browser session. Creating it per
 * call would open a new realtime connection each time.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}
