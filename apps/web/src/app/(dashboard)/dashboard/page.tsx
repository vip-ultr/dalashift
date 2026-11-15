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
  Users,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { z } from 'zod';

import { HonestyMapCanvas } from '../../../components/maps/honesty-map-canvas';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { CASE_STUDY_PROFILES } from '../../../features/cases/case-study-data';

const farmListResponseSchema = z.object({
  farms: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: z.union([z.number(), z.string().transform(Number)]).nullable(),
      farming_method: z.string().optional().nullable(),
      irrigation_method: z.string().optional().nullable(),
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
  const [farms, setFarms] = React.useState<
    z.infer<typeof farmListResponseSchema>['farms']
  >([]);
  const [userName, setUserName] = React.useState<string>('Farmer');
  const [loading, setLoading] = React.useState(true);
  const [needsSignIn, setNeedsSignIn] = React.useState(false);

  const allCaseParcels = React.useMemo(
    () => CASE_STUDY_PROFILES.flatMap((cs) => cs.parcels),
    [],
  );
  const [selectedParcelId, setSelectedParcelId] = React.useState<string>(
    allCaseParcels[0]?.id ?? '',
  );

  React.useEffect(() => {
    let active = true;

    async function loadDashboardData() {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/profile', { cache: 'no-store' });
        if (profileRes.status === 401) {
          if (active) setNeedsSignIn(true);
        } else if (profileRes.ok) {
          const profileData: unknown = await profileRes.json();
          const parsedProfile = profileResponseSchema.safeParse(profileData);
          if (parsedProfile.success && parsedProfile.data.profile.full_name) {
            if (active) setUserName(parsedProfile.data.profile.full_name);
          }
        }

        // Fetch farms
        const farmsRes = await fetch('/api/farms', { cache: 'no-store' });
        if (farmsRes.status === 401) {
          if (active) setNeedsSignIn(true);
        } else if (farmsRes.ok) {
          const farmsData: unknown = await farmsRes.json();
          const parsedFarms = farmListResponseSchema.safeParse(farmsData);
          if (parsedFarms.success && active) {
            setFarms(parsedFarms.data.farms);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboardData();
    return () => {
      active = false;
    };
  }, []);

  const totalRegisteredArea = React.useMemo(() => {
    return farms.reduce((sum, f) => sum + (f.area_ha ?? 0), 0);
  }, [farms]);

  return (
    <div className="min-h-screen bg-[#fafafb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Top Header Card */}
        <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-xs sm:flex-row sm:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="Strong">2026 Wet Season Intelligence</Badge>
              <span className="text-xs font-medium text-[#6b7280]">
                Active Farm Workspace
              </span>
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

        {/* 4 Stat Overview Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Registered Holdings</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebfaef] text-[#00b159]">
                <Sprout className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="tabular mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              {loading ? '...' : farms.length > 0 ? farms.length : '3 (Validation)'}
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              {farms.length > 0
                ? `${totalRegisteredArea.toFixed(1)} ha total land area registered`
                : 'Showing verified field holdings'}
            </p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Planting Trigger Status</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fdf6e2] text-[#b45309]">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              Moisture Watch
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Conditioned on 20 mm 3-day rainfall threshold
            </p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Soil &amp; Climate Grids</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef5fc] text-[#1d4ed8]">
                <Layers className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              ISRIC &amp; SMAP
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              250 m soil baseline with ~9 km soil moisture
            </p>
          </div>

          <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6b7280]">Data Privacy</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ebfaef] text-[#0a4232]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#111315]">
              Protected
            </div>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Row-Level Security active on private parcel records
            </p>
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
                Access farm parcels, view multi-strategy rotation evaluations, and inspect evidence
                strength.
              </p>
            </div>
            <Link href="/farms/new">
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Register Another Farm</span>
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#6b7280]">
              Loading your registered holdings...
            </div>
          ) : farms.length > 0 ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      <span>{farm.area_ha ? `${farm.area_ha.toFixed(2)} ha` : 'Area pending'}</span>
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
          ) : (
            <div className="mt-4 rounded-[10px] border border-dashed border-[#d1d5db] bg-[#fafafb] p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ebfaef] text-[#00b159]">
                <Sprout className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-[#111315]">
                No private holdings registered yet
              </h3>
              <p className="mt-1 text-xs text-[#6b7280]">
                Register your first parcel with GPS coordinates or a drawn boundary to get tailored
                rotation guidance.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Link href="/farms/new">
                  <Button variant="primary" size="sm">
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Register Farm Now</span>
                  </Button>
                </Link>
                <Link href="/cases">
                  <Button variant="secondary" size="sm">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Explore Verified Case Studies</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Interactive Map & Field Validation Quick Access */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#111315]">
                    Interactive Geospatial Map
                  </h2>
                  <p className="text-xs text-[#6b7280]">
                    MapLibre satellite imagery of monitored farm holdings.
                  </p>
                </div>
                <Link href="/farms">
                  <Button variant="secondary" size="sm">
                    <span>Full Map View</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
              <HonestyMapCanvas
                parcels={allCaseParcels}
                selectedParcelId={selectedParcelId}
                onSelectParcel={setSelectedParcelId}
                heightClass="h-[360px]"
              />
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="flex h-full flex-col justify-between rounded-[12px] border border-[#e5e7eb] bg-white p-5 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="pass">Field Validated</Badge>
                  <span className="text-[11px] text-[#6b7280]">Benchmark</span>
                </div>
                <h3 className="font-display text-base font-bold text-[#111315]">
                  Village Benchmark Cases
                </h3>
                <p className="text-xs leading-relaxed text-[#4b5563]">
                  Inspect ground-truth rotation comparisons and moisture trigger rules recorded
                  directly from local farmers:
                </p>

                <div className="space-y-2 pt-1">
                  {CASE_STUDY_PROFILES.map((cs) => (
                    <Link
                      key={cs.slug}
                      href={`/cases/${cs.slug}`}
                      className="block rounded-[8px] border border-[#e5e7eb] bg-[#fafafb] p-2.5 transition-colors hover:border-[#00b159] hover:bg-white"
                    >
                      <div className="text-xs font-semibold text-[#111315]">{cs.farmerName}</div>
                      <div className="text-[11px] text-[#6b7280]">
                        {cs.holdingSummary.slice(0, 55)}...
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-[#f3f4f6] pt-3">
                <Link href="/cases" className="text-xs font-semibold text-[#00b159] hover:underline">
                  View all case studies &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
