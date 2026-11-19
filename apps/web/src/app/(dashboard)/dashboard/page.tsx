'use client';

import { ArrowRight, FileText, MapPin, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import {
  DataStateBoundary,
  type DataViewState,
} from '../../../components/dashboard/data-state-boundary';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { useLanguage } from '../../../i18n/language-provider';
import { plantingTriggerTitle } from '../../../lib/utilities/format';

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
  const { t, language } = useLanguage();
  const tRef = React.useRef(t);
  tRef.current = t;
  const tr = React.useCallback(
    (id: string, vars?: Record<string, string | number>) => tRef.current(id, vars),
    [],
  );
  const [farms, setFarms] = React.useState<z.infer<typeof farmListResponseSchema>['farms']>([]);
  const [userName, setUserName] = React.useState<string>(t('dashboard.farmer'));
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(true);
  const activeRef = React.useRef(true);

  React.useEffect(() => {
    activeRef.current = true;
    setOnline(typeof navigator === 'undefined' || navigator.onLine);
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
        let detail = tr('dashboard.loadFarmsFailed', { status: farmsRes.status });
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
        if (activeRef.current) setFetchError(tr('state.unexpectedFarmData'));
        return;
      }
      if (activeRef.current) {
        setFarms(parsedFarms.data.farms);
        setFetchError(null);
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error);
      if (activeRef.current) {
        setFetchError(error instanceof Error ? error.message : tr('dashboard.loadDashboard'));
      }
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, [tr]);

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
    return plantingTriggerTitle(raw, language, raw.replaceAll('_', ' '));
  }, [firstFarm, language]);

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
          ? t('dashboard.notAvailable')
          : '0';
  const holdingDetail =
    farms.length > 0
      ? t('dashboard.totalLandArea', { area: totalRegisteredArea.toFixed(1) })
      : loading
        ? t('state.loading')
        : fetchError || !online
          ? t('dashboard.notAvailable')
          : t('dashboard.noFarms');

  const triggerValue = loading
    ? '...'
    : dataReady
      ? (triggerTitle ?? t('dashboard.notAvailable'))
      : t('dashboard.notAvailable');
  const triggerDetail = dataReady
    ? t('dashboard.forFarm', { name: firstFarm?.name ?? t('dashboard.firstFarm') })
    : loading
      ? t('state.loading')
      : fetchError
        ? t('state.error')
        : !online
          ? t('dashboard.offlineShort')
          : t('dashboard.noFarms');

  const gridsValue = dataReady ? t('dashboard.gridsValue') : t('dashboard.notAvailable');
  const gridsDetail = dataReady ? t('dashboard.gridsDetail') : t('dashboard.gridsNotLoaded');

  const privacyValue = dataReady ? t('dashboard.privacyValue') : t('dashboard.notAvailable');
  const privacyDetail = dataReady ? t('dashboard.privacyDetail') : t('dashboard.statusNotLoaded');

  return (
    <div className="min-h-screen bg-[#fafafb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-6 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315] sm:text-3xl">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm text-[#4b5563]">
              {t('dashboard.welcomeBack', { name: userName })}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Badge variant="Strong">{t('farms.wetSeason')}</Badge>
            <Link href="/farms/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t('nav.addFarm')}</span>
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="secondary" size="md">
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>{t('nav.reports')}</span>
              </Button>
            </Link>
          </div>
        </div>

        <section className="rounded-[12px] border border-[#e5e7eb] bg-white px-5">
          <dl className="divide-y divide-[#e5e7eb]">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-sm text-[#4b5563]">{t('dashboard.fields')}</dt>
              <dd className="tabular">
                <span className="block text-base font-semibold text-[#111827]">{holdingValue}</span>
                <span className="block text-xs text-[#6b7280]">{holdingDetail}</span>
              </dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-sm text-[#4b5563]">{t('dashboard.plantingTrigger')}</dt>
              <dd className="tabular">
                <span className="block text-base font-semibold text-[#111827]">{triggerValue}</span>
                <span className="block text-xs text-[#6b7280]">{triggerDetail}</span>
              </dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-sm text-[#4b5563]">{t('dashboard.soilClimateGrids')}</dt>
              <dd className="tabular">
                <span className="block text-base font-semibold text-[#111827]">{gridsValue}</span>
                <span className="block text-xs text-[#6b7280]">{gridsDetail}</span>
              </dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="text-sm text-[#4b5563]">{t('dashboard.dataPrivacy')}</dt>
              <dd className="tabular">
                <span className="block text-base font-semibold text-[#111827]">{privacyValue}</span>
                <span className="block text-xs text-[#6b7280]">{privacyDetail}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[12px] border border-[#e5e7eb] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#111315]">{t('farms.title')}</h2>
              <p className="mt-0.5 text-sm text-[#6b7280]">{t('farms.hint')}</p>
            </div>
            <Link href="/farms/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('farms.addFarm')}</span>
              </Button>
            </Link>
          </div>

          <DataStateBoundary
            className="mt-4"
            state={viewState}
            emptyKind="no-data"
            sourceName={t('state.sourceFarmService')}
            errorMessage={fetchError ?? undefined}
            offlineMessage={t('state.offline')}
            onRetry={() => {
              void load();
            }}
            onPrimaryAction={() => {
              window.location.href = '/farms/new';
            }}
            primaryActionLabel={t('nav.addFarm')}
          >
            {farms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className="flex flex-col justify-between rounded-[10px] border border-[#e5e7eb] bg-[#fafafb] p-4 transition-colors hover:border-[#0a4232] hover:bg-white"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#111315]">{farm.name}</span>
                        <Badge variant="pass">{t('dashboard.active')}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-[#6b7280]">
                        <MapPin className="h-3.5 w-3.5 text-[#6b7280]" aria-hidden="true" />
                        <span>
                          {farm.area_ha
                            ? `${farm.area_ha.toFixed(2)} ha`
                            : t('dashboard.areaPending')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {t('dashboard.farmingMethod', {
                          method: farm.farming_method || t('farms.rainfed'),
                        })}
                      </p>
                    </div>
                    <div className="mt-4 border-t border-[#e5e7eb] pt-3">
                      <Link
                        href={`/farms/${farm.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a4232] hover:underline"
                      >
                        <span>{t('farms.openWorkspace')}</span>
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
