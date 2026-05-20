import type { Metadata } from "next";

// Внутренняя страница (питч-дек) — вне индекса поисковиков. Из sitemap исключена.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PresentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden">
      {children}
    </div>
  );
}
