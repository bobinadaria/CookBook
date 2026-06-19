import type { Metadata, Viewport } from "next";
// Display-стек (self-hosted, без Google CDN): Bodoni Moda — латиница, через @fontsource (локальные
// woff2); Playfair Display — кириллица + фолбэк, через next/font. У Bodoni Moda НЕТ кириллицы
// (latin/latin-ext/math/symbols), поэтому русские заголовки идут Playfair — как и в прототипе.
// body = Inter (замена Work Sans), reader = Lora (замена Newsreader).
import { Playfair_Display, Inter, Lora } from "next/font/google";
import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import CursorGlow from "@/components/animations/CursorGlow";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getSiteUrl } from "@/lib/site-url";

// ─── Типографика (editorial magazine) ──────────────────────────────────────
// Playfair Display — кириллица заголовков + фолбэк к Bodoni (у которого кириллицы нет).
const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
const body = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});
const reader = Lora({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-reader",
  display: "swap",
});

const SITE_URL = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "The Slow Table — Your Cookbook with an AI Nutritionist",
    template: "%s — The Slow Table",
  },
  description:
    "Build your own book of beautiful recipes — the comfort of home, daily ideas, and exact nutrition from an AI nutritionist.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "The Slow Table",
    title: "The Slow Table — Your Cookbook with an AI Nutritionist",
    description:
      "Build your own book of beautiful recipes — the comfort of home, daily ideas, and exact nutrition from an AI nutritionist.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Slow Table · by Daria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Slow Table — Your Cookbook with an AI Nutritionist",
    description:
      "Build your own book of beautiful recipes — the comfort of home, daily ideas, and exact nutrition from an AI nutritionist.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * viewport-fit=cover — required for safe area insets to work on iPhone notch /
 * Dynamic Island. Without this env(safe-area-inset-*) returns 0 on all devices.
 *
 * Chrome on iOS uses the same WebKit engine as Safari, so this applies to both.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${body.variable} ${reader.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <CursorGlow />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
