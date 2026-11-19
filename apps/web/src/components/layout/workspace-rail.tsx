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

import { useLanguage } from '../../i18n/language-provider';
import { signOut } from '../../lib/auth/sign-out';
import { cn } from '../../lib/utilities/cn';
import { Button } from '../ui/button';
import { LanguageSwitcher } from '../ui/language-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const PRIMARY_NAV_ITEMS = [
  {
    href: '/dashboard',
    labelId: 'nav.overview',
    icon: LayoutDashboard,
    matchPrefix: '/dashboard',
  },
  {
    href: '/farms',
    labelId: 'nav.myFields',
    icon: Tractor,
    matchPrefix: '/farms',
    exactExclude: '/farms/new',
  },
  {
    href: '/farms/new',
    labelId: 'nav.addFarm',
    icon: PlusCircle,
    matchPrefix: '/farms/new',
  },
  {
    href: '/reports',
    labelId: 'nav.reports',
    icon: FileText,
    matchPrefix: '/reports',
  },
] as const;

const SECONDARY_NAV_ITEMS = [
  {
    href: '/methodology',
    labelId: 'nav.methodology',
    icon: BookOpen,
    matchPrefix: '/methodology',
  },
  {
    href: '/profile',
    labelId: 'nav.settings',
    icon: UserCircle2,
    matchPrefix: '/profile',
  },
] as const;

export function WorkspaceRail() {
  const pathname = usePathname();
  const { t } = useLanguage();
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
    <TooltipProvider>
      {/* Mobile Top Header with Logo and Hamburger Menu Button (Replaces bottom nav) */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-[#e5e7eb] bg-white px-4 lg:hidden print:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-horizontal.svg"
            alt="DalaShift"
            width={391}
            height={100}
            className="h-6 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
          aria-label={t('rail.openMenu')}
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
                  width={391}
                  height={100}
                  className="h-7 w-auto"
                />
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex size-8 items-center justify-center rounded-md text-[#4b5563] hover:bg-[#f3f4f6]"
                  aria-label={t('rail.closeMenu')}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4">
                <span className="text-xs font-semibold tracking-wider text-[#9ca3af] uppercase">
                  {t('rail.workspace')}
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
                        <span>{t(item.labelId)}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-6">
                <span className="text-xs font-semibold tracking-wider text-[#9ca3af] uppercase">
                  {t('rail.preferences')}
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
                        <span>{t(item.labelId)}</span>
                      </Link>
                    );
                  })}
                  <div className="px-1 pb-1 pt-2">
                    <LanguageSwitcher className="w-full" />
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#b42318] hover:bg-[#fdeceb] transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="size-4.5" />
                    <span>{t('nav.signOut')}</span>
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
                  {t('nav.addFarm')}
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop 64px Vertical Icon Rail */}
      <aside
        aria-label={t('rail.labelAria')}
        className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col items-center justify-between border-r border-[#e5e7eb] bg-white py-4 lg:flex print:hidden"
      >
        <div className="flex flex-col items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                aria-label={t('rail.home')}
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
            </TooltipTrigger>
            <TooltipContent>{t('rail.home')}</TooltipContent>
          </Tooltip>

          <div className="my-1 h-px w-8 bg-[#e5e7eb]" />

          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={t(item.labelId)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-all',
                      active
                        ? 'bg-[#eaf2ee] text-[#0a4232] shadow-2xs font-semibold'
                        : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
                    )}
                  >
                    <Icon className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{t(item.labelId)}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    aria-label={t(item.labelId)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-all',
                      active
                        ? 'bg-[#eaf2ee] text-[#0a4232]'
                        : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
                    )}
                  >
                    <Icon className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{t(item.labelId)}</TooltipContent>
              </Tooltip>
            );
          })}

          <div className="w-full px-1 pt-1">
            <LanguageSwitcher compact className="w-full flex-col !h-auto gap-1" />
          </div>

          <div className="relative">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label={t('nav.signOut')}
                  className="flex size-10 items-center justify-center rounded-xl text-[#6b7280] hover:bg-[#fdeceb] hover:text-[#b42318] transition-all cursor-pointer"
                >
                  <LogOut className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('nav.signOut')}</TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  );
}
