'use client';

import { FARMER_GOAL_LABELS } from '@dalashift/shared/constants';
import { AlertCircle, LoaderCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { useLanguage } from '../../i18n/language-provider';
import { formatCropWithHausa } from '../../lib/utilities/format';
import { Button } from '../ui/button';

const limitationSchema = z.object({ statement: z.string() });

const reportResponseSchema = z.object({
  report: z.object({
    payload: z.object({
      generatedAt: z.string(),
      periodStart: z.string().nullable(),
      periodEnd: z.string().nullable(),
      kind: z.string(),
      farm: z.object({ name: z.string(), totalAreaHa: z.number() }),
      parcels: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          areaHa: z.number(),
          geometryMethod: z.string(),
          locationUncertaintyM: z.number().nullable(),
          coordinatesIncluded: z.literal(false),
        }),
      ),
      crops: z.array(
        z.object({
          cropId: z.string(),
          status: z.string(),
          season: z.string(),
        }),
      ),
      priorities: z.object({ goals: z.array(z.string()), notes: z.string().nullable() }).nullish(),
      comparison: z.object({ limitations: z.array(limitationSchema) }).nullish(),
      plantingTrigger: z
        .object({
          parcelId: z.string().nullable(),
          condition: z.string(),
          riskProfile: z.string(),
          limitations: z.array(limitationSchema),
        })
        .nullish(),
      seasonalOutlook: z
        .object({
          parcelId: z.string().nullable(),
          riskStatements: z.array(z.string()),
          limitations: z.array(limitationSchema),
        })
        .nullish(),
      attributions: z.array(
        z.object({
          name: z.string(),
          licence: z.string(),
          attribution: z.string(),
        }),
      ),
      disclaimer: z.string(),
    }),
  }),
});
const errorResponseSchema = z.object({ error: z.string() });
type ReportPayload = z.infer<typeof reportResponseSchema>['report']['payload'];

const catalogSchema = z.object({
  crops: z.array(z.object({ id: z.string(), code: z.string(), name: z.string() })),
});

type Translator = (id: string, vars?: Record<string, string | number>) => string;

function kindLabels(t: Translator): Readonly<Record<string, string>> {
  return {
    farm_summary: t('report.kindFarmSummary'),
    seasonal: t('report.kindSeasonal'),
    rotation_plan: t('report.kindRotationPlan'),
  };
}

function cropStatusLabels(t: Translator): Readonly<Record<string, string>> {
  return {
    current: t('workspace.statusCurrent'),
    previous: t('workspace.statusPrevious'),
    planned: t('workspace.statusPlanned'),
  };
}

function seasonLabels(t: Translator): Readonly<Record<string, string>> {
  return {
    rainy: t('workspace.seasonRainy'),
    dry: t('workspace.seasonDry'),
    harmattan: t('workspace.seasonHarmattan'),
    year_round: t('workspace.seasonYearRound'),
    unknown: t('farms.notRecorded'),
  };
}

function methodLabels(t: Translator): Readonly<Record<string, string>> {
  return {
    gps_point: t('report.methodGpsPoint'),
    drawn_polygon: t('report.methodDrawnBoundary'),
  };
}

function formatGeneratedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : date.toLocaleDateString();
}

function goalLabels(report: ReportPayload, t: Translator): string[] {
  return (report.priorities?.goals ?? []).map(
    (goal) => FARMER_GOAL_LABELS[goal as keyof typeof FARMER_GOAL_LABELS] ?? t('report.statedGoal'),
  );
}

function fieldAssessmentNotes(parcelId: string, report: ReportPayload, t: Translator): string[] {
  const notes: string[] = [];
  const trigger = report.plantingTrigger;
  if (trigger && (trigger.parcelId === null || trigger.parcelId === parcelId)) {
    notes.push(t('report.whenToSow', { condition: trigger.condition }));
    notes.push(t('report.whatThisMeans', { detail: trigger.riskProfile }));
  }
  const outlook = report.seasonalOutlook;
  if (outlook && (outlook.parcelId === null || outlook.parcelId === parcelId)) {
    notes.push(...outlook.riskStatements);
  }
  return notes;
}

function collectLimitations(report: ReportPayload | null): string[] {
  if (!report) return [];
  const seen = new Set<string>();
  const statements: string[] = [];
  const lists = [
    report.comparison?.limitations,
    report.plantingTrigger?.limitations,
    report.seasonalOutlook?.limitations,
  ];
  for (const list of lists) {
    for (const item of list ?? []) {
      if (!seen.has(item.statement)) {
        seen.add(item.statement);
        statements.push(item.statement);
      }
    }
  }
  return statements;
}

export function RegisteredFarmReport({ farmId }: { readonly farmId: string }): React.JSX.Element {
  const { language, t } = useLanguage();
  const [report, setReport] = React.useState<ReportPayload | null>(null);
  const [cropNames, setCropNames] = React.useState<Record<string, { name: string; code: string }>>(
    {},
  );
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/catalog/crops', { cache: 'no-store' });
        if (!response.ok) return;
        const payload: unknown = await response.json();
        const parsed = catalogSchema.safeParse(payload);
        if (parsed.success && active) {
          setCropNames(
            Object.fromEntries(
              parsed.data.crops.map((crop) => [crop.id, { name: crop.name, code: crop.code }]),
            ),
          );
        }
      } catch {
        // Crop names fall back to the identifier when the catalog is unavailable.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/farms/${farmId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'rotation_plan' }),
      });
      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new Error(t('state.invalidResponse'));
      }

      if (!response.ok) {
        const parsedError = errorResponseSchema.safeParse(payload);
        throw new Error(
          parsedError.success
            ? parsedError.data.error
            : t('state.requestFailed', { status: response.status }),
        );
      }

      const parsed = reportResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error(t('report.errIncomplete'));
      setReport(parsed.data.report.payload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('report.errGenerate'));
    } finally {
      setLoading(false);
    }
  };

  const limitations = collectLimitations(report);

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 print:hidden">
          <Link href={`/farms/${farmId}`} className="text-sm font-medium text-[#0a4232] underline">
            {t('report.backToFarm')}
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={generateReport} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {loading ? t('report.generating') : t('reports.generate')}
            </Button>
            {report ? (
              <Button type="button" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden="true" />
                {t('report.printSave')}
              </Button>
            ) : null}
          </div>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-[#fdeceb] p-3 text-sm text-[#b42318]"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {errorMessage}{' '}
              {errorMessage.includes('Authentication') ? (
                <Link href="/login" className="font-medium underline">
                  {t('nav.signIn')}
                </Link>
              ) : null}
            </span>
          </div>
        ) : null}

        {report ? (
          <article className="space-y-6 rounded-xl border border-[#e5e7eb] bg-white p-6 sm:p-10 print:border-0 print:p-2">
            <header className="border-b-2 border-[#111315] pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-display text-xl font-bold tracking-tight text-[#111315]">
                  DalaShift
                </span>
                <span className="text-xs text-[#6b7280]">
                  {kindLabels(t)[report.kind] ?? t('report.kindFieldReport')}
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold">{report.farm.name}</h1>
              <p className="mt-1 text-sm text-[#4b5563]">
                {t('report.headerLine', {
                  area: report.farm.totalAreaHa.toFixed(2),
                  date: formatGeneratedDate(report.generatedAt),
                })}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                {t('report.periodLine', {
                  start: report.periodStart ?? t('report.notSpecified'),
                  end: report.periodEnd ?? t('report.notSpecified'),
                })}
              </p>
              {goalLabels(report, t).length > 0 ? (
                <p className="mt-1 text-xs text-[#6b7280]">
                  {t('report.whatMatters', { goals: goalLabels(report, t).join(', ') })}
                </p>
              ) : null}
            </header>

            <section>
              <h2 className="font-semibold">{t('workspace.fields')}</h2>
              <ul className="mt-2 divide-y divide-[#e5e7eb]">
                {report.parcels.map((parcel) => {
                  const notes = fieldAssessmentNotes(parcel.id, report, t);
                  return (
                    <li key={parcel.id} className="break-inside-avoid py-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-semibold text-[#111315]">{parcel.name}</span>
                        <span className="text-[#4b5563]">
                          {parcel.areaHa > 0
                            ? `${parcel.areaHa.toFixed(2)} ha`
                            : t('workspace.gpsPointChip', {
                                uncertainty: parcel.locationUncertaintyM ?? 500,
                              })}
                          {' · '}
                          {t('report.coordinatesRedacted')}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {methodLabels(t)[parcel.geometryMethod] ?? t('report.locationRecorded')}
                      </p>
                      {notes.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-[#4b5563]">
                          {notes.map((note, index) => (
                            <li key={`note-${index}`}>{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[#4b5563]">{t('report.noFieldAssessment')}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">{t('report.cropRecordsTitle')}</h2>
              {report.crops.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-[#4b5563]">
                  {report.crops.map((crop, index) => {
                    const catalogCrop = cropNames[crop.cropId];
                    const label = catalogCrop
                      ? formatCropWithHausa(catalogCrop.code, language === 'ha')
                      : t('report.uncataloguedCrop');
                    const status = cropStatusLabels(t)[crop.status] ?? t('report.recorded');
                    const season = seasonLabels(t)[crop.season] ?? t('farms.notRecorded');
                    return (
                      <li key={`${crop.cropId}-${index}`}>
                        {t('report.cropLine', { label, status, season })}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#4b5563]">{t('report.noCropRecords')}</p>
              )}
            </section>

            <section>
              <h2 className="font-semibold">{t('workspace.dataLimits')}</h2>
              {limitations.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4b5563]">
                  {limitations.map((statement, index) => (
                    <li key={`gap-${index}`}>{statement}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#4b5563]">{t('report.noGaps')}</p>
              )}
            </section>

            <footer className="border-t-2 border-[#111315] pt-4 text-xs leading-relaxed text-[#4b5563]">
              <p className="font-semibold text-[#111315]">{t('report.sourcesTitle')}</p>
              {report.attributions.length > 0 ? (
                <ul className="mt-2 space-y-3">
                  {report.attributions.map((source) => (
                    <li key={source.name} className="break-inside-avoid">
                      <p className="font-semibold text-[#111315]">
                        {source.name} · {source.licence}
                      </p>
                      <p>{source.attribution}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">{t('report.noSources')}</p>
              )}
              <p className="mt-4 border-t border-[#e5e7eb] pt-3">{report.disclaimer}</p>
            </footer>
          </article>
        ) : (
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#4b5563]">
            {t('report.emptyNote')}
          </section>
        )}
      </div>
    </div>
  );
}
