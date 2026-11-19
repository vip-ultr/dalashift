'use client';

import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import {
  DataStateBoundary,
  type DataViewState,
} from '../../../components/dashboard/data-state-boundary';
import { Button } from '../../../components/ui/button';
import { useLanguage } from '../../../i18n/language-provider';

const numericValue = z.union([z.number(), z.string().transform(Number)]).nullable();

const farmListSchema = z.object({
  farms: z.array(z.object({ id: z.string().uuid(), name: z.string(), area_ha: numericValue })),
});

const reportListSchema = z.object({
  reports: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      generated_at: z.string(),
      period_start: z.string().nullable(),
      period_end: z.string().nullable(),
      signed_url: z.string().nullable().optional(),
    }),
  ),
});

interface HoldingReports {
  readonly farmId: string;
  readonly farmName: string;
  readonly areaHa: number | null;
  readonly reports: z.infer<typeof reportListSchema>['reports'];
  readonly error: string | null;
}

export default function ReportsHubPage(): React.JSX.Element {
  const { t } = useLanguage();
  const tRef = React.useRef(t);
  tRef.current = t;
  const tr = React.useCallback(
    (id: string, vars?: Record<string, string | number>) => tRef.current(id, vars),
    [],
  );
  const [state, setState] = React.useState<'loading' | 'ready' | 'error' | 'unauthenticated'>(
    'loading',
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [holdings, setHoldings] = React.useState<HoldingReports[]>([]);
  const [missingSources, setMissingSources] = React.useState<string[]>([]);
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
    setState('loading');
    try {
      const farmsResponse = await fetch('/api/farms', { cache: 'no-store' });
      if (farmsResponse.status === 401) {
        if (activeRef.current) setState('unauthenticated');
        return;
      }
      if (!farmsResponse.ok) throw new Error(tr('farms.loadError'));
      const payload: unknown = await farmsResponse.json();
      const parsed = farmListSchema.safeParse(payload);
      if (!parsed.success) throw new Error(tr('reports.unexpectedFarms'));

      const results = await Promise.all(
        parsed.data.farms.map(async (farm) => {
          const base = { farmId: farm.id, farmName: farm.name, areaHa: farm.area_ha };
          try {
            const response = await fetch(`/api/farms/${farm.id}/reports`, {
              cache: 'no-store',
            });
            if (!response.ok) {
              return {
                ...base,
                reports: [],
                error: tr('reports.loadFarmReportsError'),
              };
            }
            const body: unknown = await response.json();
            const reportPayload = reportListSchema.safeParse(body);
            return {
              ...base,
              reports: reportPayload.success ? reportPayload.data.reports : [],
              error: reportPayload.success ? null : tr('reports.unexpectedReports'),
            };
          } catch {
            return {
              ...base,
              reports: [],
              error: tr('reports.loadFarmReportsError'),
            };
          }
        }),
      );

      if (activeRef.current) {
        setHoldings(results);
        setMissingSources(
          results.filter((holding) => holding.error !== null).map((holding) => holding.farmName),
        );
        setState('ready');
      }
    } catch (error) {
      if (activeRef.current) {
        setErrorMessage(error instanceof Error ? error.message : tr('reports.loadReportsError'));
        setState('error');
      }
    }
  }, [tr]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const reportCount = holdings.reduce((sum, holding) => sum + holding.reports.length, 0);

  const viewState: DataViewState = !online
    ? 'offline'
    : state === 'loading'
      ? 'loading'
      : state === 'error'
        ? holdings.length > 0
          ? 'stale'
          : 'error'
        : state === 'ready' && missingSources.length > 0
          ? 'partial'
          : state === 'ready' && reportCount === 0
            ? 'empty'
            : 'ready';

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-white p-6 sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#111315]">
              {t('reports.title')}
            </h1>
            <p className="max-w-2xl text-sm text-[#4b5563]">{t('reports.subtitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link href="/farms/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>{t('farms.addFarm')}</span>
              </Button>
            </Link>
          </div>
        </div>

        {state === 'unauthenticated' ? (
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#4b5563]">
            <p>{t('reports.signInPrompt')}</p>
            <Link
              href="/login?next=/reports"
              className="mt-3 inline-block font-medium text-[#0a4232] underline"
            >
              {t('nav.signIn')}
            </Link>
          </div>
        ) : null}

        <DataStateBoundary
          state={viewState}
          emptyKind="no-data"
          sourceName={t('state.sourceReport')}
          errorMessage={errorMessage ?? undefined}
          missingSources={missingSources}
          offlineMessage={t('state.offline')}
          onRetry={() => {
            void load();
          }}
          onPrimaryAction={() => {
            window.location.href = '/farms';
          }}
          primaryActionLabel={t('nav.myFields')}
        >
          <div className="space-y-4">
            {holdings.map((holding) => (
              <section
                key={holding.farmId}
                className="rounded-[12px] border border-[#e5e7eb] bg-white p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#111315]">
                      {holding.farmName}
                    </h2>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      {holding.areaHa === null
                        ? t('dashboard.notAvailable')
                        : `${holding.areaHa.toFixed(2)} ha`}
                      {' · '}
                      {holding.reports.length === 1
                        ? t('reports.savedOne', { count: holding.reports.length })
                        : t('reports.savedMany', { count: holding.reports.length })}
                    </p>
                  </div>
                  <Link href={`/farms/${holding.farmId}/reports`}>
                    <Button variant="secondary" size="sm">
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t('reports.generate')}</span>
                    </Button>
                  </Link>
                </div>

                {holding.reports.length > 0 ? (
                  <ul className="mt-4 divide-y divide-[#e5e7eb]">
                    {holding.reports.map((report) => (
                      <li
                        key={report.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div>
                          <span className="font-semibold text-[#111315]">
                            {report.kind.replaceAll('_', ' ')}
                          </span>
                          <p className="mt-0.5 text-xs text-[#6b7280]">
                            {t('reports.generated', {
                              date: new Date(report.generated_at).toLocaleDateString(),
                            })}
                            {report.period_start && report.period_end
                              ? ` · ${t('reports.periodRange', {
                                  start: report.period_start,
                                  end: report.period_end,
                                })}`
                              : ''}
                          </p>
                        </div>
                        {report.signed_url ? (
                          <a
                            href={report.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a4232] hover:underline"
                          >
                            <FileText className="size-3.5" aria-hidden="true" />
                            {t('reports.openPdf')}
                          </a>
                        ) : (
                          <span className="text-xs text-[#9ca3af]">{t('reports.noPdf')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : holding.error ? null : (
                  <p className="mt-4 text-xs text-[#6b7280]">
                    {t('reports.noReports')} {t('reports.generate')}.
                  </p>
                )}
              </section>
            ))}
          </div>
        </DataStateBoundary>
      </div>
    </div>
  );
}
