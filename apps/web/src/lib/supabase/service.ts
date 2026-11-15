import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * The privileged Supabase client, restricted to server-side cache,
 * environmental observation ingestion, first-party account/session rows,
 * profile creation during registration and cache operations.
 *
 * Authenticated farmer data reads and writes must use the user-scoped client
 * from `./server` so Row Level Security remains the enforcement boundary.
 * The observation-ingestion helper is a narrow exception: it writes validated
 * provenance rows only after a user-scoped request has verified parcel access.
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
