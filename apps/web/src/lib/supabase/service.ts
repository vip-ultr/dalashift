import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * The privileged Supabase client, restricted strictly to server-side cache,
 * environmental observation persistence, and administrative/seed tasks.
 *
 * Never use this client to read or write farmer-scoped records (`farms`,
 * `parcels`, `farm_crops`, `farm_priorities`) on behalf of a user request.
 * Farmer requests must use `createClient` from `./server` so Row Level
 * Security remains the enforcement boundary.
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
