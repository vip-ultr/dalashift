'use client';

import { ChevronLeft, ChevronRight, FolderPlus, MapPin, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { z } from 'zod';

import { cn } from '../../lib/utilities/cn';
import { Button } from '../ui/button';

const farmListSchema = z.object({
  farms: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      area_ha: z.union([z.number(), z.string().transform(Number)]).nullable(),
    }),
  ),
});

export interface ParcelSidebarDrawerProps {
  readonly className?: string;
}

export function ParcelSidebarDrawer({ className }: ParcelSidebarDrawerProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [farms, setFarms] = React.useState<z.infer<typeof farmListSchema>['farms']>([]);
  const [_loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    async function loadFarms() {
      try {
        const res = await fetch('/api/farms', { cache: 'no-store' });
        if (res.ok) {
          const payload: unknown = await res.json();
          const parsed = farmListSchema.safeParse(payload);
          if (parsed.success && active) {
            setFarms(parsed.data.farms);
          }
        }
      } catch {
        // Silently handle if not signed in
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFarms();
    return () => {
      active = false;
    };
  }, []);

  const filteredFarms = farms.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const totalArea = React.useMemo(() => {
    return farms.reduce((sum, f) => sum + (f.area_ha ?? 0), 0);
  }, [farms]);

  if (collapsed) {
    return (
      <div className="sticky top-0 hidden h-screen flex-col items-center border-r border-[#e5e7eb] bg-white py-3 px-1.5 xl:flex print:hidden">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expand parcel drawer"
          aria-label="Expand parcel drawer"
          className="flex size-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] cursor-pointer"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Parcels drawer"
      className={cn(
        'sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col justify-between border-r border-[#e5e7eb] bg-white xl:flex print:hidden',
        className,
      )}
    >
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-2 border-b border-[#f3f4f6] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#111827]">Your Farm Parcels</h2>
            <p className="text-xs text-[#6b7280]">
              {farms.length > 0
                ? `${farms.length} holdings · ${totalArea.toFixed(1)} ha`
                : 'No parcels registered'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Collapse drawer"
            aria-label="Collapse drawer"
            className="flex size-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] cursor-pointer"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        {farms.length > 0 ? (
          <>
            {/* Inline Search Box */}
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search parcels..."
                aria-label="Search parcels"
                className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#fafafb] pr-3 pl-8 text-xs text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#0a4232]"
              />
            </div>

            {/* Farm Parcels List */}
            <ul className="mt-3 space-y-1">
              {filteredFarms.map((farm) => {
                const href = `/farms/${farm.id}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={farm.id}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-[#eaf2ee] text-[#0a4232] font-semibold'
                          : 'text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]',
                      )}
                    >
                      <MapPin className="size-3.5 shrink-0 text-[#0a4232]" />
                      <span className="truncate">{farm.name}</span>
                      {farm.area_ha && (
                        <span className="ml-auto text-[10px] text-[#6b7280]">
                          {farm.area_ha.toFixed(1)} ha
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          /* Clean Empty State */
          <div className="mt-8 rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafb] p-4 text-center">
            <div className="mx-auto flex size-8 items-center justify-center rounded-full bg-[#eaf2ee] text-[#0a4232]">
              <FolderPlus className="size-4" />
            </div>
            <h3 className="mt-2 text-xs font-semibold text-[#111827]">No parcels added yet</h3>
            <p className="mt-1 text-[11px] text-[#6b7280]">
              Register your land coordinates to view personalized moisture guidance.
            </p>
            <Link href="/farms/new" className="mt-3 inline-block">
              <Button variant="primary" size="sm" className="h-7 text-xs">
                <Plus className="mr-1 size-3" />
                Add Parcel
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="border-t border-[#f3f4f6] p-3 space-y-2">
        <Link href="/farms/new">
          <Button variant="outline" size="sm" className="w-full text-xs">
            <Plus className="mr-1 size-3.5" />
            Add New Farm
          </Button>
        </Link>
        <Link
          href="/register?new=true"
          className="block text-center text-[11px] font-medium text-[#6b7280] hover:text-[#0a4232] transition-colors"
        >
          Create another account
        </Link>
      </div>
    </aside>
  );
}
