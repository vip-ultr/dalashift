'use client';

import { FARMER_GOAL_LABELS } from '@dalashift/shared/constants';
import { AlertCircle, LoaderCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { formatCropWithHausa } from '../../lib/utilities/format';
import { usePreferredLanguage } from '../../hooks/use-preferred-language';
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

const KIND_LABELS: Readonly<Record<string, string>> = {
  farm_summary: 'Farm summary',
  seasonal: 'Seasonal outlook',
  rotation_plan: 'Rotation plan',
};

const CROP_STATUS_LABELS: Readonly<Record<string, string>> = {
  current: 'Current',
  previous: 'Previous',
  planned: 'Planned',
};

const SEASON_LABELS: Readonly<Record<string, string>> = {
  rainy: 'Rainy',
  dry: 'Dry',
  harmattan: 'Harmattan',
  year_round: 'Year round',
  unknown: 'Not recorded',
};

const METHOD_LABELS: Readonly<Record<string, string>> = {
  gps_point: 'GPS point',
  drawn_polygon: 'Drawn boundary',
};

function formatGeneratedDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : date.toLocaleDateString();
}

function goalLabels(report: ReportPayload): string[] {
  return (report.priorities?.goals ?? []).map(
    (goal) => FARMER_GOAL_LABELS[goal as keyof typeof FARMER_GOAL_LABELS] ?? 'A stated goal',
  );
}

function fieldAssessmentNotes(parcelId: string, report: ReportPayload): string[] {
  const notes: string[] = [];
  const trigger = report.plantingTrigger;
  if (trigger && (trigger.parcelId === null || trigger.parcelId === parcelId)) {
    notes.push(`When to sow: ${trigger.condition}`);
    notes.push(`What this means: ${trigger.riskProfile}`);
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
  const { language } = usePreferredLanguage();
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
        throw new Error('The server returned an invalid response.');
      }

      if (!response.ok) {
        const parsedError = errorResponseSchema.safeParse(payload);
        throw new Error(
          parsedError.success ? parsedError.data.error : `Request failed (${response.status}).`,
        );
      }

      const parsed = reportResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error('The server returned an incomplete report.');
      setReport(parsed.data.report.payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to generate this report right now.',
      );
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
            Back to farm
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={generateReport} disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {loading ? 'Generating…' : 'Generate report'}
            </Button>
            {report ? (
              <Button type="button" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden="true" />
                Print / Save PDF
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
                  Sign in
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
                  {KIND_LABELS[report.kind] ?? 'Field report'}
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold">{report.farm.name}</h1>
              <p className="mt-1 text-sm text-[#4b5563]">
                {report.farm.totalAreaHa.toFixed(2)} ha total · Generated{' '}
                {formatGeneratedDate(report.generatedAt)}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Period: {report.periodStart ?? 'Not specified'} to{' '}
                {report.periodEnd ?? 'Not specified'}
              </p>
              {goalLabels(report).length > 0 ? (
                <p className="mt-1 text-xs text-[#6b7280]">
                  What matters here: {goalLabels(report).join(', ')}
                </p>
              ) : null}
            </header>

            <section>
              <h2 className="font-semibold">Fields</h2>
              <ul className="mt-2 divide-y divide-[#e5e7eb]">
                {report.parcels.map((parcel) => {
                  const notes = fieldAssessmentNotes(parcel.id, report);
                  return (
                    <li key={parcel.id} className="break-inside-avoid py-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="font-semibold text-[#111315]">{parcel.name}</span>
                        <span className="text-[#4b5563]">
                          {parcel.areaHa > 0
                            ? `${parcel.areaHa.toFixed(2)} ha`
                            : `GPS point, ±${parcel.locationUncertaintyM ?? 500} m`}
                          {' · Coordinates redacted'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b7280]">
                        {METHOD_LABELS[parcel.geometryMethod] ?? 'Location recorded'}
                      </p>
                      {notes.length > 0 ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-[#4b5563]">
                          {notes.map((note, index) => (
                            <li key={`note-${index}`}>{note}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[#4b5563]">
                          No field assessment was prepared. Review this field with the farmer before
                          deciding.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h2 className="font-semibold">Farmer-supplied crop records</h2>
              {report.crops.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-[#4b5563]">
                  {report.crops.map((crop, index) => {
                    const catalogCrop = cropNames[crop.cropId];
                    const label = catalogCrop
                      ? formatCropWithHausa(catalogCrop.code, language === 'ha')
                      : 'Uncatalogued crop';
                    const status = CROP_STATUS_LABELS[crop.status] ?? 'Recorded';
                    const season = SEASON_LABELS[crop.season] ?? 'Not recorded';
                    return (
                      <li key={`${crop.cropId}-${index}`}>
                        {label}: {status}, {season} season
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#4b5563]">No crop records are available.</p>
              )}
            </section>

            <section>
              <h2 className="font-semibold">What the data cannot tell us</h2>
              {limitations.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#4b5563]">
                  {limitations.map((statement, index) => (
                    <li key={`gap-${index}`}>{statement}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#4b5563]">
                  No specific gaps were recorded for this report. Check local conditions with the
                  farmer before deciding.
                </p>
              )}
            </section>

            <footer className="border-t-2 border-[#111315] pt-4 text-xs leading-relaxed text-[#4b5563]">
              <p className="font-semibold text-[#111315]">Sources used in this report</p>
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
                <p className="mt-2">No external data source was used in this report.</p>
              )}
              <p className="mt-4 border-t border-[#e5e7eb] pt-3">{report.disclaimer}</p>
            </footer>
          </article>
        ) : (
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#4b5563]">
            Generate a report to load this farm&apos;s saved information and data-source
            attributions. Exact parcel coordinates are excluded.
          </section>
        )}
      </div>
    </div>
  );
}
