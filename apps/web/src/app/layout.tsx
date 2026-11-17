import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';

import './globals.css';

import { ServiceWorkerRegistrar } from '../components/layout/service-worker-registrar';
import { SiteFooter } from '../components/layout/site-footer';
import { LanguageProvider } from '../i18n/language-provider';

/**
 * Geologica for display headings and the wordmark, Inter for body, tables, and
 * dense workspace UI. Bundled fonts keep builds independent of Google Fonts.
 */
const inter = localFont({
  src: './fonts/inter-latin-variable.woff2',
  display: 'swap',
  variable: '--font-inter',
  weight: '100 900',
});

const geologica = localFont({
  src: './fonts/geologica-latin-variable.woff2',
  display: 'swap',
  variable: '--font-geologica',
  weight: '100 900',
});

const DESCRIPTION = 'Climate-informed crop rotation decisions for rain-fed farmers.';

export const metadata: Metadata = {
  title: {
    default: 'DalaShift',
    template: '%s | DalaShift',
  },
  description: DESCRIPTION,
  applicationName: 'DalaShift',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32' },
      { url: '/favicon-16x16.png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'DalaShift',
    description: DESCRIPTION,
    type: 'website',
    siteName: 'DalaShift',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DalaShift, climate-informed crop rotation decisions for rain-fed farmers.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DalaShift',
    description: DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a4232',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${geologica.variable}`}>
      <body>
        <LanguageProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-primary focus:shadow-md"
          >
            Skip to main content
          </a>
          <main id="main-content">{children}</main>
          <SiteFooter />
          <ServiceWorkerRegistrar />
        </LanguageProvider>
      </body>
    </html>
  );
}
