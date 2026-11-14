'use client';

import { AlertCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { cn } from '../../lib/utilities/cn';
import { formatMetricValue } from '../../lib/utilities/format';
import { ProvenanceLine } from '../dashboard/provenance-line';

export interface TimeSeriesPoint {
  readonly label: string;
  readonly value: number | null;
  readonly baseline?: number | null;
  readonly isMissingGap?: boolean;
}

export interface HonestyTimeSeriesChartProps {
  readonly title: string;
  readonly summarySentence: string;
  readonly unit: string;
  readonly chartType?: 'bar' | 'line';
  readonly data: readonly TimeSeriesPoint[];
  readonly sourceId: string;
  readonly spatialResolutionM: number;
  readonly observedAt: string | null;
  readonly isModelled: boolean;
  readonly gapNotice?: string | null;
  readonly baselineLabel?: string;
  readonly className?: string;
}

/**
 * Environmental chart adhering strictly to docs/design/design-system.md section 9.3
 * and docs/product/user-flows.md section 5:
 * - Leads with a plain-language summary sentence above the chart.
 * - Starts count/rainfall axes at zero.
 * - Explicitly marks missing windows (e.g. cloud cover gaps) with a visible gap
 *   band and notice, never interpolating or plotting a zero.
 */
export function HonestyTimeSeriesChart({
  title,
  summarySentence,
  unit,
  chartType = 'bar',
  data,
  sourceId,
  spatialResolutionM,
  observedAt,
  isModelled,
  gapNotice,
  baselineLabel = '30-yr average',
  className,
}: HonestyTimeSeriesChartProps) {
  const missingLabels = data.filter((d) => d.value === null || d.isMissingGap).map((d) => d.label);
  const gapStart = missingLabels[0];
  const gapEnd = missingLabels[missingLabels.length - 1];

  return (
    <article
      className={cn(
        'flex flex-col justify-between rounded-2xl border border-border bg-surface-raised p-5',
        className,
      )}
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <span className="rounded bg-[#f4f5f6] px-2 py-0.5 text-xs font-medium text-ink-muted tabular">
            Unit: {unit}
          </span>
        </div>

        {/* Highest-value convention: plain-language summary sentence above the chart */}
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-[#0a4232]">
          {summarySentence}
        </p>

        {/* Explicit Missing Data Gap Notice (Journey C) */}
        {gapNotice ? (
          <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#b9770e]/30 bg-[#fdf6e5] px-3 py-2 text-xs text-[#8e5636]">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{gapNotice}</span>
          </div>
        ) : null}

        <div className="mt-4 h-56 w-full" aria-label={`${title}. ${summarySentence}`}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={[...data]}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#5c6066' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#5c6066' }}
                  axisLine={false}
                  tickLine={false}
                  unit={` ${unit}`}
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    val === null || val === undefined
                      ? 'Missing observation (gap)'
                      : `${formatMetricValue(Number(val), 1)} ${unit}`,
                    title,
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                {gapStart && gapEnd ? (
                  <ReferenceArea
                    x1={gapStart}
                    x2={gapEnd}
                    fill="#fdf6e5"
                    stroke="#b9770e"
                    strokeDasharray="3 3"
                  />
                ) : null}
                <Bar
                  dataKey="value"
                  name={`Observed (${unit})`}
                  fill="#3d6382"
                  radius={[4, 4, 0, 0]}
                />
                {data.some((pt) => pt.baseline !== undefined && pt.baseline !== null) ? (
                  <Bar
                    dataKey="baseline"
                    name={baselineLabel}
                    fill="#c3d6cc"
                    radius={[4, 4, 0, 0]}
                  />
                ) : null}
              </BarChart>
            ) : (
              <LineChart
                data={[...data]}
                margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#5c6066' }}
                  axisLine={{ stroke: '#d1d5db' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#5c6066' }}
                  axisLine={false}
                  tickLine={false}
                  unit={unit === '1' ? '' : ` ${unit}`}
                />
                <Tooltip
                  formatter={(val: unknown) => [
                    val === null || val === undefined
                      ? 'No valid pass (cloud gap)'
                      : `${formatMetricValue(Number(val), 2)} ${unit === '1' ? '' : unit}`,
                    title,
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                {gapStart && gapEnd ? (
                  <ReferenceArea
                    x1={gapStart}
                    x2={gapEnd}
                    fill="#fdf6e5"
                    stroke="#b9770e"
                    strokeDasharray="3 3"
                  />
                ) : null}
                {data.some((pt) => pt.baseline !== undefined && pt.baseline !== null) ? (
                  <ReferenceLine
                    y={
                      data.find((pt) => pt.baseline !== null && pt.baseline !== undefined)
                        ?.baseline ?? 0
                    }
                    stroke="#8e5636"
                    strokeDasharray="4 4"
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00b159"
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: '#00b159' }}
                  connectNulls={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Screen-reader & plain-text accessible table summary */}
        <p className="sr-only">
          {title}: {summarySentence}. Series points:{' '}
          {data
            .map(
              (pt) =>
                `${pt.label}: ${pt.value === null ? 'missing observation' : `${pt.value} ${unit}`}`,
            )
            .join(', ')}
        </p>
      </div>

      <ProvenanceLine
        sourceId={sourceId}
        spatialResolutionM={spatialResolutionM}
        observedAt={observedAt}
        isModelled={isModelled}
        className="mt-4"
      />
    </article>
  );
}
