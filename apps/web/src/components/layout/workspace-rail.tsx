'use client';

import {
  BookOpen,
  FileText,
  FolderKanban,
  LayoutGrid,
  PlusCircle,
  Sprout,
  UserCircle2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '../../lib/utilities/cn';

const PRIMARY_NAV_ITEMS = [
  {
    href: '/farms',
    label: 'My Farms & Map',
    icon: LayoutGrid,
    matchPrefix: '/farms',
    exactExclude: '/farms/new',
  },
  {
    href: '/cases',
    label: 'Tofa Case Studies',
    icon: Users,
    matchPrefix: '/cases',
  },
  {
    href: '/farms/new',
    label: 'Add Farm / Parcel',
    icon: PlusCircle,
    matchPrefix: '/farms/new',
  },
  {
    href: '/reports',
    label: 'Field Reports',
    icon: FileText,
    matchPrefix: '/reports',
  },
] as const;

const SECONDARY_NAV_ITEMS = [
  {
    href: '/methodology',
    label: 'Methodology & Sources',
    icon: BookOpen,
    matchPrefix: '/methodology',
  },
  {
    href: '/profile',
    label: 'Farmer / Adviser Profile',
    icon: UserCircle2,
    matchPrefix: '/profile',
  },
] as const;

/**
 * 56px desktop icon rail (`lg+`) and mobile bottom navigation bar (`< lg`)
 * modeled on the OneSoil workspace shell (`--sidebar-width: 56px`).
 */
export function WorkspaceRail() {
  const pathname = usePathname();

  const isItemActive = (item: {
    readonly href: string;
    readonly matchPrefix: string;
    readonly exactExclude?: string;
  }) => {
    if (item.exactExclude && pathname.startsWith(item.exactExclude)) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(item.matchPrefix);
  };

  return (
    <>
      {/* Desktop 56px Vertical Icon Rail */}
      <aside
        aria-label="Workspace navigation"
        className="hidden w-[56px] shrink-0 flex-col items-center justify-between border-r border-border bg-surface-raised py-3 lg:flex print:hidden"
      >
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            title="DalaShift Home"
            aria-label="DalaShift Home"
            className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#00b159] text-white shadow-xs transition-transform hover:scale-105"
          >
            <Sprout className="size-5" />
          </Link>

          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex size-10 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-[#e9ecef] text-ink'
                    : 'text-[#74777d] hover:bg-[#f4f5f6] hover:text-ink',
                )}
              >
                <Icon className="size-5" />
                <span className="pointer-events-none absolute left-13 z-50 hidden rounded bg-[#1f2022] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md group-hover:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-2">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group relative flex size-10 items-center justify-center rounded-lg transition-colors',
                  active
                    ? 'bg-[#e9ecef] text-ink'
                    : 'text-[#74777d] hover:bg-[#f4f5f6] hover:text-ink',
                )}
              >
                <Icon className="size-5" />
                <span className="pointer-events-none absolute left-13 z-50 hidden rounded bg-[#1f2022] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md group-hover:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Mobile Sticky Bottom Bar */}
      <nav
        aria-label="Mobile workspace navigation"
        className="fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center justify-around border-t border-border bg-surface-raised px-2 lg:hidden print:hidden"
      >
        <Link
          href="/"
          className="flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-medium text-ink-muted"
        >
          <FolderKanban className="size-5" />
          <span>Home</span>
        </Link>
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1 text-[11px] font-medium',
                active ? 'text-[#00b159]' : 'text-ink-muted',
              )}
            >
              <Icon className="size-5" />
              <span className="truncate max-w-[76px]">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
