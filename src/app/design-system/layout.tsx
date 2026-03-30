"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  { label: "Обзор", href: "/design-system" },
  { label: "Цвета", href: "/design-system#colors" },
  { label: "Типографика", href: "/design-system#typography" },
  { label: "Кнопки", href: "/design-system#buttons" },
  { label: "Инпуты", href: "/design-system#inputs" },
  { label: "Тогл", href: "/design-system#toggles" },
  { label: "Карточка рецепта", href: "/design-system#recipe-card" },
  { label: "Избранное", href: "/design-system#favorite-button" },
  { label: "Фильтр", href: "/design-system#filter-dropdown" },
  { label: "Тени и скругления", href: "/design-system#shadows" },
  { label: "Анимации", href: "/design-system#animations" },
];

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-charcoal/10 bg-cream sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-charcoal/10">
          <Link href="/" className="text-xs text-charcoal/40 hover:text-peach transition-colors">
            &larr; На сайт
          </Link>
          <h1 className="font-serif text-2xl text-charcoal mt-3">
            Design System
          </h1>
          <p className="text-xs text-charcoal/40 mt-1">CookBook UI Kit</p>
        </div>

        <nav className="p-4 flex flex-col gap-0.5">
          {NAV_SECTIONS.map((item) => {
            const isActive =
              item.href === "/design-system"
                ? pathname === "/design-system"
                : false;
            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-sand text-charcoal font-medium"
                    : "text-charcoal/50 hover:text-charcoal hover:bg-sand/50"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
