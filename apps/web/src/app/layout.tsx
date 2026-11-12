import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

/**
 * Root layout.
 *
 * Phase 1 scaffolding only. The application shell, navigation, authentication
 * providers and marketing sections are Phase 2 deliverables.
 */
export const metadata: Metadata = {
  title: {
    default: 'DalaShift',
    template: '%s | DalaShift',
  },
  description:
    'DalaShift — farm-level agricultural intelligence from NASA Earth observation data. ' +
    'Working name; see docs/product/ for the product definition.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
