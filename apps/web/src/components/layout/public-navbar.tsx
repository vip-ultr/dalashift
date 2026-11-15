'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Button } from '../ui/button';

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Overview' },
    { href: '/farms', label: 'Field Workspace' },
    { href: '/cases', label: 'Field Validation' },
    { href: '/methodology', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5e7eb] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logo-horizontal.svg"
            alt="DalaShift"
            width={140}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? 'text-[#0a4232]'
                    : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/farms/new">
            <Button variant="primary" size="sm">
              Add Farm
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg border border-[#e5e7eb] text-[#4b5563] hover:bg-[#f3f4f6]"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer from Left */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex w-[280px] max-w-[80vw] flex-col justify-between bg-white p-5 shadow-2xl">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex size-8 items-center justify-center rounded-md text-[#4b5563] hover:bg-[#f3f4f6]"
                  aria-label="Close menu"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-4 flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 items-center rounded-lg px-3 text-sm font-medium text-[#111827] hover:bg-[#eaf2ee] hover:text-[#0a4232]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-[#e5e7eb]">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="md" className="w-full">
                  Sign in
                </Button>
              </Link>
              <Link href="/farms/new" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  Add Farm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
