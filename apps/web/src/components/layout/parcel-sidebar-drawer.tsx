'use client';

import { ChevronLeft, ChevronRight, FolderPlus, HelpCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { CASE_STUDY_PROFILES } from '../../features/cases/case-study-data';
import { cn } from '../../lib/utilities/cn';
import { formatMetricValue } from '../../lib/utilities/format';
import { ParcelVectorThumbnail } from '../farms/parcel-vector-thumbnail';

export interface ParcelSidebarDrawerProps {
  readonly className?: string;
}

/**
 * 288px collapsible secondary field/case-study drawer modeled on the OneSoil
 * workspace sidebar (`Season 2026`, search filter, parcel rows with 40x40px
 * dark vector thumbnails, and the "Add your fields" CTA card).
 */
export function ParcelSidebarDrawer({ className }: ParcelSidebarDrawerProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState('');

  const filteredCases = CASE_STUDY_PROFILES.filter(
    (cs) =>
      cs.farmerName.toLowerCase().includes(query.toLowerCase()) ||
      cs.holdingSummary.toLowerCase().includes(query.toLowerCase()) ||
      cs.cropCodes.some((code) => code.toLowerCase().includes(query.toLowerCase())),
  );

  const totalValidatedHa = CASE_STUDY_PROFILES.reduce(
    (sum, cs) => sum + cs.parcels.reduce((pSum, parcel) => pSum + (parcel.areaHa ?? 0), 0),
    0,
  );

  if (collapsed) {
    return (
      <div className="hidden flex-col items-center border-r border-border bg-surface-raised py-3 px-1.5 xl:flex print:hidden">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expand field and case study drawer"
          aria-label="Expand field and case study drawer"
          className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-[#f4f5f6] hover:text-ink cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Parcels and field case studies list"
      className={cn(
        'hidden w-[288px] shrink-0 flex-col justify-between border-r border-border bg-surface-raised xl:flex print:hidden',
        className,
      )}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">2026 Wet Season</h2>
            <p className="text-xs text-ink-muted tabular">
              {formatMetricValue(totalValidatedHa, 2)} ha across {CASE_STUDY_PROFILES.length}{' '}
              holdings
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Collapse drawer"
            aria-label="Collapse drawer"
            className="flex size-8 items-center justify-center rounded-md text-ink-muted hover:bg-[#f4f5f6] hover:text-ink cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        {/* Inline Search Box */}
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search farmer, parcel, crop..."
            aria-label="Search farmer, parcel, or crop"
            className="h-8 w-full rounded-md bg-[#f4f5f6] pr-3 pl-8 text-xs text-ink placeholder:text-ink-faint outline-none focus:ring-1 focus:ring-[#00b159]"
          />
        </div>

        {/* Validated Case Studies List */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
            <span>Doka Village Case Studies</span>
            <span>Tofa LGA</span>
          </div>

          <ul className="mt-2 space-y-1.5">
            {filteredCases.map((cs) => {
              const firstParcel = cs.parcels[0]!;
              const holdingArea = cs.parcels.reduce((s, p) => s + (p.areaHa ?? 0), 0);
              const href = `/cases/${cs.slug}`;
              const isActive = pathname === href || pathname.includes(cs.farm.id);

              return (
                <li key={cs.slug}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg p-2 transition-colors',
                      isActive ? 'bg-[#e9ecef] text-ink' : 'hover:bg-[#f4f5f6] text-ink',
                    )}
                  >
                    <ParcelVectorThumbnail
                      geometry={firstParcel.geometry}
                      size={40}
                      active={isActive}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-ink">
                          {cs.farmerName}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded bg-[#00b159] px-1.5 py-0.2 text-[10px] font-medium text-white">
                          Tofa LGA
                        </span>
                        <span className="text-[11px] text-ink-muted tabular">
                          {formatMetricValue(holdingArea, 1)} ha · {cs.parcels.length} parcels
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* OneSoil-inspired "Add your fields" Empty/CTA Card */}
        <div className="mt-5 rounded-xl bg-[#f4f5f6] px-4 py-5 text-center">
          <div className="mx-auto flex size-9 items-center justify-center rounded-lg bg-surface-raised text-ink shadow-2xs">
            <FolderPlus className="size-4.5" />
          </div>
          <h3 className="mt-2.5 text-sm font-semibold text-ink">Add your farm or parcel</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Capture a GPS point with accuracy radius or draw your field boundary on the map to
            compare rotations for your land.
          </p>
          <Link
            href="/farms/new"
            className="mt-3.5 inline-flex h-8 items-center justify-center rounded-lg bg-[#0a4232] px-4 text-xs font-medium text-white transition-colors hover:bg-[#072f24]"
          >
            + Add fields
          </Link>
        </div>

        {/* Extension Officer / Methodology Card */}
        <div className="mt-3 rounded-xl border border-[#0a4232]/20 bg-[#eaf2ee]/50 p-4 text-center">
          <HelpCircle className="mx-auto size-5 text-[#0a4232]" />
          <h3 className="mt-1.5 text-sm font-semibold text-[#111827]">
            Working with an extension officer?
          </h3>
          <p className="mt-1 text-xs text-[#4b5563]">
            Switch between Farmer View and Adviser View or print a shareable sheet for local review
            with your malamin gona.
          </p>
          <Link
            href="/reports"
            className="mt-3 inline-flex h-8 items-center justify-center rounded-lg bg-[#0a4232] px-4 text-xs font-medium text-white transition-colors hover:bg-[#072f24]"
          >
            Open printable reports
          </Link>
        </div>
      </div>
    </aside>
  );
}
