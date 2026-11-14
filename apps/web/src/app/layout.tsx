import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/**
 * Fonts.
 *
 * Poppins for headings and the wordmark, Inter for body and UI. Both have
 * system-ui fallbacks in the CSS variables, so a failed font fetch degrades to
 * the system stack rather than breaking the build.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["600", "700"],
});

const DESCRIPTION =
  "Climate-informed crop rotation decisions for rain-fed farmers.";

export const metadata: Metadata = {
  title: {
    default: "DalaShift",
    template: "%s | DalaShift",
  },
  description: DESCRIPTION,
  applicationName: "DalaShift",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32" },
      { url: "/favicon-16x16.png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    manifest: "/site.webmanifest",
  },
  openGraph: {
    title: "DalaShift",
    description: DESCRIPTION,
    type: "website",
    siteName: "DalaShift",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DalaShift, climate-informed crop rotation decisions for rain-fed farmers.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DalaShift",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a4232",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>{children}</body>
    </html>
  );
}
