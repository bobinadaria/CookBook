import type { Metadata } from "next";
import DesignSystemShell from "./DesignSystemShell";

// Внутренняя страница (витрина UI) — вне индекса поисковиков. Из sitemap исключена.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DesignSystemShell>{children}</DesignSystemShell>;
}
