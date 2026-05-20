import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Serif_Display, Satisfy, Plus_Jakarta_Sans } from "next/font/google";
// Кириллические аналоги шрифтов хендоффа (Bodoni/Work Sans/Newsreader не имеют
// cyrillic-сабсета). Playfair Display = дидон как Bodoni (есть в фолбэке хендоффа),
// Inter = гротеск как Work Sans, Lora = текстовый сериф как Newsreader. Все с кириллицей.
import { Playfair_Display, Inter, Lora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import CursorGlow from "@/components/animations/CursorGlow";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getSiteUrl } from "@/lib/site-url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
  display: "swap",
});

const satisfy = Satisfy({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-satisfy",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// ─── НОВАЯ типографика (editorial magazine redesign) ────────────────────────
const display = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
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
    default: "bydaria.kitchen — Personal Recipe Collection",
    template: "%s — bydaria.kitchen",
  },
  description:
    "A curated collection of personal recipes by Daria — beautifully presented, cozy, and full of flavour.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "bydaria.kitchen",
    title: "bydaria.kitchen — Personal Recipe Collection",
    description:
      "A curated collection of personal recipes by Daria — beautifully presented, cozy, and full of flavour.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "bydaria.kitchen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bydaria.kitchen — Personal Recipe Collection",
    description:
      "A curated collection of personal recipes by Daria — beautifully presented, cozy, and full of flavour.",
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
      className={`${cormorant.variable} ${dmSerif.variable} ${satisfy.variable} ${plusJakarta.variable} ${display.variable} ${body.variable} ${reader.variable}`}
      suppressHydrationWarning
    >
      <body className="antialiased">
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <CursorGlow />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
