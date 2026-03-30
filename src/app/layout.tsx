import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Serif_Display, Satisfy, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import CursorGlow from "@/components/animations/CursorGlow";

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

export const metadata: Metadata = {
  title: "CookBook — Personal Recipe Collection",
  description: "A curated collection of personal recipes, beautifully presented.",
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
      className={`${cormorant.variable} ${dmSerif.variable} ${satisfy.variable} ${plusJakarta.variable}`}
    >
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <CursorGlow />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
