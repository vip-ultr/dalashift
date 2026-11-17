import 'server-only';

import type { getAuthenticatedClient } from './server';

/** The RLS-scoped client returned by `getAuthenticatedClient`. */
type AuthenticatedClient = NonNullable<
  Awaited<ReturnType<typeof getAuthenticatedClient>>
>['supabase'];

/**
 * The authenticated caller used for farm access checks. Structurally matches
 * the context returned by `getAuthenticatedClient` in ./server.
 */
export interface FarmAccessContext {
  readonly supabase: AuthenticatedClient;
  readonly user: { readonly id: string };
}

export type FarmAccessResult =
  | { readonly ok: true; readonly farm: Record<string, unknown> }
  | { readonly ok: false; readonly status: number; readonly error: string };

/**
 * Verify that a farm exists and belongs to the authenticated farmer before
 * reading or mutating any farm-scoped rows. The `farmer_id` filter is applied
 * server side, so a missing or foreign farm is indistinguishable from "no
 * access" and no other farmer's data is returned.
 *
 * `columns` lets a caller load the farm row it already needs in the same
 * query, avoiding a second round trip.
 */
export async function requireFarmOwnership(
  context: FarmAccessContext,
  farmId: string,
  columns = 'id',
): Promise<FarmAccessResult> {
  const { data, error } = await context.supabase
    .from('farms')
    .select(columns)
    .eq('id', farmId)
    .eq('farmer_id', context.user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to verify farm ownership', error);
    return { ok: false, status: 500, error: 'Unable to load farm.' };
  }
  if (!data) {
    return { ok: false, status: 404, error: 'Farm not found.' };
  }

  return { ok: true, farm: data as unknown as Record<string, unknown> };
}
