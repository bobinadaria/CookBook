"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label: string;
  groupType: string;
  items: readonly Category[];
  activeIds: Set<string>;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (groupType: string, id: string) => void;
  onClose: () => void;
}

export default function FilterDropdown({
  label,
  groupType,
  items,
  activeIds,
  isOpen,
  onToggle,
  onSelect,
  onClose,
}: FilterDropdownProps) {
  const t = useTranslations("recipes");
  const locale = useLocale();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const count = activeIds.size;

  useEffect(() => { setMounted(true); }, []);

  // Calculate panel position from trigger's bounding rect
  const updatePos = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + 6, left: r.left });
    }
  };

  useEffect(() => {
    if (isOpen) updatePos();
  }, [isOpen]);

  // Keep panel aligned while open (scroll / resize)
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [isOpen]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        !triggerRef.current?.contains(t) &&
        !panelRef.current?.contains(t)
      ) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  const panel = (
    <div
      ref={panelRef}
      style={{ position: "fixed", top: panelPos.top, left: panelPos.left, zIndex: 9999 }}
      className="min-w-[200px] bg-cream border border-sand rounded-2xl shadow-[0_8px_32px_rgba(28,25,23,0.12)] overflow-hidden dropdown-panel"
    >
      <div className="p-2">
        {items.map((cat) => {
          const checked = activeIds.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(groupType, cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left",
                checked
                  ? "bg-charcoal/5 text-charcoal font-medium"
                  : "text-charcoal/60 hover:bg-sand hover:text-charcoal"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  checked ? "bg-charcoal border-charcoal" : "border-charcoal/20"
                )}
              >
                {checked && (
                  <svg className="w-2.5 h-2.5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {(locale === "en" && cat.name_en) ? cat.name_en : cat.name}
            </button>
          );
        })}
      </div>

      {count > 0 && (
        <div className="border-t border-sand px-4 py-2.5">
          <button
            onClick={() => Array.from(activeIds).forEach((id) => onSelect(groupType, id))}
            className="text-xs text-charcoal/35 hover:text-peach transition-colors"
          >
            {t("clearSelection")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border",
          isOpen
            ? "bg-charcoal text-cream border-charcoal"
            : count > 0
            ? "bg-peach/10 text-peach border-peach/40 hover:border-peach"
            : "bg-transparent text-charcoal/60 border-charcoal/15 hover:border-charcoal/35 hover:text-charcoal"
        )}
      >
        <span>{label}</span>
        {count > 0 && !isOpen && (
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-peach text-white text-[10px] font-semibold leading-none">
            {count}
          </span>
        )}
        <svg
          className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen ? "rotate-180" : "")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {mounted && isOpen && createPortal(panel, document.body)}
    </div>
  );
}
