'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BookOpen, ChevronRight, Home, LogIn, Menu, Plus, Tractor, X } from 'lucide-react';

import { useLanguage } from '../../i18n/language-provider';
import { cn } from '../../lib/utilities/cn';
import { Button } from '../ui/button';
import { LanguageSwitcher } from '../ui/language-switcher';

export function PublicNavbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('nav.overview'), icon: Home },
    { href: '/farms', label: t('nav.myFields'), icon: Tractor },
    { href: '/methodology', label: t('nav.methodology'), icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-white">
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
        <nav className="hidden items-center gap-4 lg:gap-7 md:flex">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active ? 'text-[#0a4232] font-semibold' : 'text-[#4b5563] hover:text-[#111827]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop action cluster: language switcher plus existing buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher compact />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {t('nav.signIn')}
            </Button>
          </Link>
          <Link href="/farms/new">
            <Button variant="primary" size="sm">
              {t('nav.addFarm')}
            </Button>
          </Link>
        </div>

        {/* Mobile header: language switcher beside the hamburger, visible without opening */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex size-10 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#111827] transition-colors hover:bg-[#f9fafb] active:bg-[#f3f4f6] cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel - Solid, Modern, Professional Dropdown */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col md:hidden">
          {/* Solid dim backdrop without blur */}
          <div
            className="fixed inset-0 top-16 bg-black/60 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Solid Opaque White Menu Container */}
          <div className="relative z-10 w-full border-b border-[#e5e7eb] bg-white shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-5 pt-3 pb-6 space-y-4">
              <nav className="flex flex-col space-y-1">
                {navLinks.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-[#eaf2ee] text-[#0a4232] font-semibold'
                          : 'text-[#374151] hover:bg-[#f9fafb] hover:text-[#111827]',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-lg',
                            active ? 'bg-[#0a4232] text-white' : 'bg-[#f3f4f6] text-[#4b5563]',
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight
                        className={cn('size-4', active ? 'text-[#0a4232]' : 'text-[#9ca3af]')}
                      />
                    </Link>
                  );
                })}
              </nav>

              <div className="px-1">
                <LanguageSwitcher className="w-full" />
              </div>

              <div className="h-px w-full bg-[#f3f4f6]" />

              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="md" className="w-full justify-center">
                    <LogIn className="mr-2 size-4" aria-hidden="true" />
                    <span>{t('nav.signIn')}</span>
                  </Button>
                </Link>
                <Link href="/farms/new" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="md" className="w-full justify-center">
                    <Plus className="mr-1.5 size-4" aria-hidden="true" />
                    <span>{t('nav.addFarm')}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
