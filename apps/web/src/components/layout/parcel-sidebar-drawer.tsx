'use client';

import { ChevronLeft, ChevronRight, FolderPlus, MapPin, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { z } from 'zod';

import { cn } from '../../lib/utilities/cn';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

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
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [isOffline, setIsOffline] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    async function loadFarms() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/farms', { cache: 'no-store' });
        if (!res.ok) throw new Error('Your farms could not be loaded right now.');
        const payload: unknown = await res.json();
        const parsed = farmListSchema.safeParse(payload);
        if (!parsed.success) throw new Error('Your farms could not be read right now.');
        if (active) setFarms(parsed.data.farms);
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : 'Your farms could not be loaded right now.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFarms();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  React.useEffect(() => {
    const update = () => setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const filteredFarms = farms.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const totalArea = React.useMemo(() => {
    return farms.reduce((sum, f) => sum + (f.area_ha ?? 0), 0);
  }, [farms]);

  if (collapsed) {
    return (
      <TooltipProvider>
        <div className="sticky top-0 hidden h-screen flex-col items-center border-r border-[#e5e7eb] bg-white py-3 px-1.5 xl:flex print:hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label="Expand farms drawer"
                className="flex size-8 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Expand farms drawer</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <aside
        aria-label="Farms drawer"
        className={cn(
          'sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col justify-between border-r border-[#e5e7eb] bg-white xl:flex print:hidden',
          className,
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Drawer Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[#f3f4f6] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#111827]">Your farms</h2>
              <p className="text-xs text-[#6b7280]">
                {farms.length > 0
                  ? `${farms.length} farms · ${totalArea.toFixed(1)} ha`
                  : 'No fields yet'}
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setCollapsed(true)}
                  aria-label="Collapse drawer"
                  className="flex size-7 items-center justify-center rounded-md text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827] cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Collapse drawer</TooltipContent>
            </Tooltip>
          </div>

          {isOffline ? (
            <div
              role="status"
              className="mt-3 rounded-md border border-[#b9770e]/30 bg-[#fdf6e5] px-2.5 py-2 text-[11px] text-[#8e5636]"
            >
              You are offline. Showing the farms saved on this device. New changes may not appear
              until you are online.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-3 space-y-2" role="status" aria-label="Loading your farms">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="mt-3 rounded-lg border border-[#f5c2c0] bg-[#fdeceb] p-3 text-[11px] text-[#b42318]"
            >
              <p className="font-semibold">{loadError}</p>
              <p className="mt-1">Your other farm details are safe.</p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-2 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : farms.length > 0 ? (
            <>
              {/* Inline Search Box */}
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search farms..."
                  aria-label="Search farms"
                  className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#fafafb] pr-3 pl-8 text-xs text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#0a4232]"
                />
              </div>

              {/* Farms list */}
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
              <h3 className="mt-2 text-xs font-semibold text-[#111827]">No fields yet</h3>
              <p className="mt-1 text-[11px] text-[#6b7280]">
                Register your land coordinates to view personalized moisture guidance.
              </p>
              <Link href="/farms/new" className="mt-3 inline-block">
                <Button variant="primary" size="sm" className="h-7 text-xs">
                  <Plus className="mr-1 size-3" />
                  Add a farm
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
        </div>
      </aside>
    </TooltipProvider>
  );
}
