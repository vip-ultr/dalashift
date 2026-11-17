'use client';

import { AlertCircle, LoaderCircle, Printer } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { formatCropWithHausa } from '../../lib/utilities/format';
import { usePreferredLanguage } from '../../hooks/use-preferred-language';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const reportResponseSchema = z.object({
  report: z.object({
    payload: z.object({
      generatedAt: z.string(),
      periodStart: z.string().nullable(),
      periodEnd: z.string().nullable(),
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

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 sm:px-6 lg:px-8 print:bg-white print:p-0">
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
              <Badge variant="Strong">DalaShift Field Report</Badge>
              <h1 className="mt-2 font-display text-2xl font-bold">{report.farm.name}</h1>
              <p className="mt-1 text-sm text-[#4b5563]">
                {report.farm.totalAreaHa.toFixed(2)} ha total · Generated{' '}
                {new Date(report.generatedAt).toLocaleDateString()}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Period: {report.periodStart ?? 'Not specified'} to{' '}
                {report.periodEnd ?? 'Not specified'}
              </p>
            </header>

            <section>
              <h2 className="font-semibold">Parcels</h2>
              <ul className="mt-2 divide-y divide-[#e5e7eb]">
                {report.parcels.map((parcel) => (
                  <li key={parcel.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                    <span>{parcel.name}</span>
                    <span className="text-[#4b5563]">
                      {parcel.areaHa > 0
                        ? `${parcel.areaHa.toFixed(2)} ha`
                        : `GPS point, ±${parcel.locationUncertaintyM ?? 500} m`}
                      {' · Coordinates redacted'}
                    </span>
                  </li>
                ))}
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
                    return (
                      <li key={`${crop.cropId}-${index}`}>
                        {label}: {crop.status}, {crop.season} season
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-[#4b5563]">No crop records are available.</p>
              )}
            </section>

            <section>
              <h2 className="font-semibold">Data sources and attribution</h2>
              <ul className="mt-2 space-y-3 text-xs text-[#4b5563]">
                {report.attributions.map((source) => (
                  <li key={source.name}>
                    <p className="font-semibold text-[#111315]">
                      {source.name} · {source.licence}
                    </p>
                    <p>{source.attribution}</p>
                  </li>
                ))}
              </ul>
            </section>

            <footer className="border-t border-[#e5e7eb] pt-4 text-xs leading-relaxed text-[#4b5563]">
              {report.disclaimer}
            </footer>
          </article>
        ) : (
          <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 text-sm text-[#4b5563]">
            Generate a report to load this farm&apos;s saved information and data-source
            attributions. Exact parcel coordinates are excluded.
          </section>
        )}
      </div>
    </main>
  );
}
