'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Tractor,
  UserCircle2,
  X,
} from 'lucide-react';

import { signOut } from '../../lib/auth/sign-out';
import { cn } from '../../lib/utilities/cn';
import { Button } from '../ui/button';

const PRIMARY_NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    matchPrefix: '/dashboard',
  },
  {
    href: '/farms',
    label: 'Farms',
    icon: Tractor,
    matchPrefix: '/farms',
    exactExclude: '/farms/new',
  },
  {
    href: '/farms/new',
    label: 'Add Farm / Parcel',
    icon: PlusCircle,
    matchPrefix: '/farms/new',
  },
  {
    href: '/reports',
    label: 'Advisory Reports',
    icon: FileText,
    matchPrefix: '/reports',
  },
] as const;

const SECONDARY_NAV_ITEMS = [
  {
    href: '/methodology',
    label: 'Data & Methodology',
    icon: BookOpen,
    matchPrefix: '/methodology',
  },
  {
    href: '/profile',
    label: 'Settings',
    icon: UserCircle2,
    matchPrefix: '/profile',
  },
] as const;

export function WorkspaceRail() {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    const result = await signOut();
    if (!result.ok) {
      setSignOutError(result.error);
      return;
    }
    window.location.assign('/login');
  };

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
      {/* Mobile Top Header with Logo and Hamburger Menu Button (Replaces bottom nav) */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 lg:hidden print:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-horizontal.svg"
            alt="DalaShift"
            width={112}
            height={26}
            className="h-6 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
          aria-label="Open sidebar menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* Mobile Slide-Over Drawer from Left */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative flex w-[280px] max-w-[85vw] flex-col justify-between bg-white p-5 shadow-2xl border-r border-[#e5e7eb]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e7eb]">
                <Image
                  src="/brand/logo-horizontal.svg"
                  alt="DalaShift"
                  width={120}
                  height={28}
                  className="h-7 w-auto"
                />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-md text-[#4b5563] hover:bg-[#f3f4f6]"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4">
                <span className="text-[11px] font-semibold tracking-wider text-[#9ca3af] uppercase">
                  Workspace
                </span>
                <nav className="mt-2 flex flex-col gap-1">
                  {PRIMARY_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-[#eaf2ee] text-[#0a4232]'
                            : 'text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]',
                        )}
                      >
                        <Icon className="size-4.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-6">
                <span className="text-[11px] font-semibold tracking-wider text-[#9ca3af] uppercase">
                  Preferences
                </span>
                <nav className="mt-2 flex flex-col gap-1">
                  {SECONDARY_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={cn(
                          'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                          active
                            ? 'bg-[#eaf2ee] text-[#0a4232]'
                            : 'text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]',
                        )}
                      >
                        <Icon className="size-4.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#b42318] hover:bg-[#fdeceb] transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="size-4.5" />
                    <span>Sign out</span>
                  </button>
                  {signOutError && (
                    <p role="alert" className="mt-1 px-3 text-xs text-[#b42318]">
                      {signOutError}
                    </p>
                  )}
                </nav>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e5e7eb]">
              <Link href="/farms/new" onClick={() => setMobileDrawerOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  + Add Field
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop 64px Vertical Icon Rail */}
      <aside
        aria-label="Workspace navigation rail"
        className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center justify-between border-r border-[#e5e7eb] bg-white py-4 lg:flex print:hidden"
      >
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            title="DalaShift Home"
            aria-label="DalaShift Home"
            className="flex size-10 items-center justify-center rounded-xl transition-transform hover:scale-105"
          >
            <Image
              src="/brand/logo.svg"
              alt="DalaShift"
              width={34}
              height={34}
              priority
              className="size-8.5 w-auto"
            />
          </Link>

          <div className="my-1 h-px w-8 bg-[#e5e7eb]" />

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
                  'group relative flex size-10 items-center justify-center rounded-xl transition-all',
                  active
                    ? 'bg-[#eaf2ee] text-[#0a4232] shadow-2xs font-semibold'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
                )}
              >
                <Icon className="size-5" />
                <span className="pointer-events-none absolute left-14 z-50 hidden rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md group-hover:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
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
                  'group relative flex size-10 items-center justify-center rounded-xl transition-all',
                  active
                    ? 'bg-[#eaf2ee] text-[#0a4232]'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
                )}
              >
                <Icon className="size-5" />
                <span className="pointer-events-none absolute left-14 z-50 hidden rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md group-hover:block">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="group relative flex size-10 items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#fdeceb] hover:text-[#b42318] transition-all cursor-pointer"
            >
              <LogOut className="size-5" />
              <span className="pointer-events-none absolute left-14 z-50 hidden rounded-md bg-[#111827] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md group-hover:block">
                Sign out
              </span>
            </button>
            {signOutError && (
              <p
                role="alert"
                className="absolute right-11 bottom-0 z-50 w-56 rounded-md border border-[#fecdca] bg-white p-2 text-xs text-[#b42318] shadow-md"
              >
                {signOutError}
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
