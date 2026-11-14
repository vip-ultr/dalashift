'use client';

import { Compass, Menu, Sprout, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { cn } from '../../lib/utilities/cn';

export interface PublicNavbarProps {
  readonly className?: string;
}

/**
 * Floating pill navigation bar modeled on OneSoil's public header (`rounded-[40px]`
 * with subtle blur and crisp contrast over the warm sand `#f6f4ef` background).
 */
export function PublicNavbar({ className }: PublicNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-3 z-40 mx-auto w-full max-w-[1200px] px-4 sm:px-6',
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between rounded-[40px] border border-white/70 bg-white/80 px-5 shadow-[0_2px_16px_rgba(21,21,21,0.04)] backdrop-blur-md">
        {/* Brand Wordmark */}
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-ink hover:opacity-90"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#00b159] text-white shadow-xs">
            <Sprout className="size-5" />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-tight">
              DalaShift
            </span>
            <span className="hidden rounded-full bg-[#ede8e2] px-2 py-0.5 text-[10px] font-medium text-[#6d6351] sm:inline-block">
              Working Name
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-7 text-sm font-medium text-ink md:flex"
        >
          <Link
            href="/cases"
            className="transition-colors hover:text-[#00b159]"
          >
            Tofa LGA Case Studies
          </Link>
          <Link
            href="/farms"
            className="transition-colors hover:text-[#00b159]"
          >
            Field Workspace
          </Link>
          <Link
            href="/methodology"
            className="transition-colors hover:text-[#00b159]"
          >
            Methodology &amp; Sources
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium text-ink transition-colors hover:bg-black/5"
          >
            Sign in
          </Link>
          <Link
            href="/cases/bello-yusuf-maitama"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[#00b159] px-4 text-sm font-medium text-white transition-colors hover:bg-[#00994d]"
          >
            <Compass className="size-4" />
            Open Workspace
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          className="inline-flex size-10 items-center justify-center rounded-full text-ink hover:bg-black/5 md:hidden cursor-pointer"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {menuOpen ? (
        <div className="mt-2 rounded-3xl border border-border bg-[#151515] p-5 text-white shadow-xl md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/cases"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl bg-white/10 px-4 py-3 text-base font-medium hover:bg-white/15"
            >
              Tofa LGA Case Studies
            </Link>
            <Link
              href="/farms"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl bg-white/10 px-4 py-3 text-base font-medium hover:bg-white/15"
            >
              Field Workspace
            </Link>
            <Link
              href="/methodology"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl bg-white/10 px-4 py-3 text-base font-medium hover:bg-white/15"
            >
              Methodology &amp; Data Sources
            </Link>
            <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/farms/new"
                onClick={() => setMenuOpen(false)}
                className="flex h-12 items-center justify-center rounded-2xl bg-[#00b159] text-sm font-medium text-white"
              >
                + Add Farm
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
