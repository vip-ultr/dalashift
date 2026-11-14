import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_BUCKETS = {
  farmReports: 'farm-reports',
  farmAttachments: 'farm-attachments',
} as const;

export const REPORT_SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Construct the canonical per-farmer, per-farm storage path (`{farmerId}/{farmId}/{fileName}`)
 * enforced by `public.user_owns_storage_farm_path` in the Storage RLS policy.
 */
export function buildFarmStoragePath(input: {
  readonly farmerId: string;
  readonly farmId: string;
  readonly fileName: string;
}): string {
  const cleanFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${input.farmerId}/${input.farmId}/${cleanFileName}`;
}

/**
 * Upload a generated JSON report artifact into the private `farm-reports`
 * bucket under the authenticated farmer's farm prefix, returning the stored
 * object path and a short-lived signed URL when available.
 */
export async function uploadFarmReportArtifact(input: {
  readonly supabase: SupabaseClient;
  readonly farmerId: string;
  readonly farmId: string;
  readonly reportId: string;
  readonly payload: unknown;
}): Promise<{
  readonly storagePath: string | null;
  readonly signedUrl: string | null;
}> {
  const storagePath = buildFarmStoragePath({
    farmerId: input.farmerId,
    farmId: input.farmId,
    fileName: `${input.reportId}.json`,
  });

  const body = JSON.stringify(input.payload, null, 2);
  const { error: uploadError } = await input.supabase.storage
    .from(STORAGE_BUCKETS.farmReports)
    .upload(storagePath, body, {
      contentType: 'application/json',
      upsert: true,
    });

  if (uploadError) {
    console.warn('Unable to upload report artifact to Storage bucket; keeping inline payload.', {
      storagePath,
      message: uploadError.message,
    });
    return { storagePath: null, signedUrl: null };
  }

  const { data: signedData } = await input.supabase.storage
    .from(STORAGE_BUCKETS.farmReports)
    .createSignedUrl(storagePath, REPORT_SIGNED_URL_TTL_SECONDS);

  return {
    storagePath,
    signedUrl: signedData?.signedUrl ?? null,
  };
}

/**
 * Create a short-lived signed download URL for an existing private report object.
 */
export async function createReportSignedUrl(input: {
  readonly supabase: SupabaseClient;
  readonly storagePath: string | null;
}): Promise<string | null> {
  if (!input.storagePath) return null;

  const { data, error } = await input.supabase.storage
    .from(STORAGE_BUCKETS.farmReports)
    .createSignedUrl(input.storagePath, REPORT_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
