'use client';

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers,
  MapPin,
  Plus,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import {
  DataStateBoundary,
  type DataViewState,
} from '../../../components/dashboard/data-state-boundary';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { PLANTING_TRIGGER_TITLES } from '../../../lib/utilities/format';

const farmListResponseSchema = z.object({
  farms: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: z.union([z.number(), z.string().transform(Number)]).nullable(),
      farming_method: z.string().optional().nullable(),
      irrigation_method: z.string().optional().nullable(),
      planting_trigger: z.string().nullable().optional(),
    }),
  ),
});

const profileResponseSchema = z.object({
  profile: z.object({
    full_name: z.string().nullable().optional(),
    preferred_language: z.string().nullable().optional(),
  }),
});

export default function DashboardOverviewPage(): React.JSX.Element {
  const [farms, setFarms] = React.useState<z.infer<typeof farmListResponseSchema>['farms']>([]);
  const [userName, setUserName] = React.useState<string>('Farmer');
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const activeRef = React.useRef(true);

  React.useEffect(() => {
    activeRef.current = true;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      activeRef.current = false;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const profileRes = await fetch('/api/profile', { cache: 'no-store' });
      if (profileRes.ok) {
        const profileData: unknown = await profileRes.json();
        const parsedProfile = profileResponseSchema.safeParse(profileData);
        if (parsedProfile.success && parsedProfile.data.profile.full_name && activeRef.current) {
          setUserName(parsedProfile.data.profile.full_name);
        }
      }

      const farmsRes = await fetch('/api/farms', { cache: 'no-store' });
      if (!farmsRes.ok) {
        let detail = `Unable to load your farms (${farmsRes.status}).`;
        try {
          const body: unknown = await farmsRes.json();
          if (
            typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof body.error === 'string'
          ) {
            detail = body.error;
          }
        } catch {
          // Keep the generic message when the error body is unreadable.
        }
        if (activeRef.current) setFetchError(detail);
        return;
      }
      const farmsData: unknown = await farmsRes.json();
      const parsedFarms = farmListResponseSchema.safeParse(farmsData);
      if (!parsedFarms.success) {
        if (activeRef.current)
          setFetchError('The server returned farm data in an unexpected format.');
        return;
      }
      if (activeRef.current) {
        setFarms(parsedFarms.data.farms);
        setFetchError(null);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      if (activeRef.current) {
        setFetchError(
          error instanceof Error ? error.message : 'Unable to load your dashboard right now.',
        );
      }
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totalRegisteredArea = React.useMemo(
    () => farms.reduce((sum, farm) => sum + (farm.area_ha ?? 0), 0),
    [farms],
  );

  const firstFarm = farms[0] ?? null;
  const triggerTitle = React.useMemo(() => {
    const raw = firstFarm?.planting_trigger;
    if (!raw) return null;
    return (
      PLANTING_TRIGGER_TITLES[raw as keyof typeof PLANTING_TRIGGER_TITLES]?.en ??
      raw.replaceAll('_', ' ')
    );
  }, [firstFarm]);

  const dataReady = farms.length > 0 && !fetchError && online;
  const viewState: DataViewState = !online
    ? 'offline'
    : fetchError
      ? farms.length > 0
        ? 'stale'
        : 'error'
      : loading && farms.length === 0
        ? 'loading'
        : farms.length === 0
          ? 'empty'
          : 'ready';

  const holdingValue =
    farms.length > 0
      ? String(farms.length)
      : loading
        ? '...'
        : fetchError || !online
          ? 'Not available'
          : '0';
  const holdingDetail =
    farms.length > 0
      ? `${totalRegisteredArea.toFixed(1)} ha total land area`
      : loading
        ? 'Loading your farms...'
        : fetchError || !online
          ? 'Not available'
          : 'No farms added yet';

  const triggerValue = loading
    ? '...'
    : dataReady
      ? (triggerTitle ?? 'Not available')
      : 'Not available';
  const triggerDetail = dataReady
    ? `For ${firstFarm?.name ?? 'your first farm'}`
    : loading
      ? 'Loading your farms...'
      : fetchError
        ? 'Could not load'
        : !online
          ? 'You are offline'
          : 'No farms added yet';

  const gridsValue = dataReady ? 'ISRIC & SMAP' : 'Not available';
  const gridsDetail = dataReady
    ? '250 m soil baseline with ~9 km soil moisture'
    : 'Grid details not loaded';

  const privacyValue = dataReady ? 'Protected' : 'Not available';
  const privacyDetail = dataReady
    ? 'Row-Level Security active on your farm records'
    : 'Status not loaded';

  return (
    <div className="min-h-screen bg-[#fafafb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-xs sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="Strong">2026 Wet Season</Badge>
              <span className="text-xs font-medium text-[#6b7280]">Active Farm Workspace</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
              Welcome back, {userName}
            </h1>
            <p className="max-w-2xl text-xs text-[#4b5563] sm:text-sm">
              Review environmental insights, soil moisture triggers, and deterministic rotation
              recommendations tailored to your registered land parcels.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link href="/farms/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Farm or Parcel</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="secondary" size="md">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>Field Reports</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 Stat Overview Metrics, derived from your own farm data */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Registered Holdings</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebfaef] text-[#00b159]">
                <Sprout className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="tabular mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              {holdingValue}
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">{holdingDetail}</p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Planting Trigger Status</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fdf6e2] text-[#b45309]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              {triggerValue}
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">{triggerDetail}</p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Soil &amp; Climate Grids</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef5fc] text-[#1d4ed8]">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              {gridsValue}
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">{gridsDetail}</p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Data Privacy</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebfaef] text-[#0a4232]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              {privacyValue}
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">{privacyDetail}</p>
          </div>
        </div>

        {/* Registered Holdings Section */}
        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f3f4f6] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111315]">
                Your Registered Holdings
              </h2>
              <p className="mt-0.5 text-xs text-[#6b7280]">
                Access farm parcels, view rotation evaluations, and inspect environmental evidence.
              </p>
            </div>
            <Link href="/farms/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Register Farm</span>
              </Button>
            </Link>
          </div>

          <DataStateBoundary
            className="mt-4"
            state={viewState}
            emptyKind="no-data"
            sourceName="Farm service"
            errorMessage={fetchError ?? undefined}
            offlineMessage="You are offline. Showing the farms saved on this device."
            onRetry={() => {
              void load();
            }}
            onPrimaryAction={() => {
              window.location.href = '/farms/new';
            }}
            primaryActionLabel="Add your first farm"
          >
            {farms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className="flex flex-col justify-between rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4 transition-colors hover:border-[#00b159] hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#111315]">{farm.name}</span>
                        <Badge variant="pass">Active</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <MapPin className="h-3.5 w-3.5 text-[#00b159]" aria-hidden="true" />
                        <span>
                          {farm.area_ha ? `${farm.area_ha.toFixed(2)} ha` : 'Area pending'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6b7280]">
                        Farming method: {farm.farming_method || 'Rainfed'}
                      </p>
                    </div>
                    <div className="mt-4 border-t border-[#e5e7eb] pt-3">
                      <Link
                        href={`/farms/${farm.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4232] hover:underline"
                      >
                        <span>Open holding workspace</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </DataStateBoundary>
        </section>
      </div>
    </div>
  );
}
