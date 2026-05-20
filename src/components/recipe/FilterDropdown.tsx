"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

const PANEL_MIN_WIDTH = 220; // px — matches min-w in className

/** Категория + число рецептов под ней (показываем рядом с названием). */
type CategoryWithCount = Category & { count?: number };

interface FilterDropdownProps {
  label: string;
  groupType: string;
  items: readonly CategoryWithCount[];
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

  /**
   * Calculates the panel position anchored to the trigger button.
   *
   * iOS Safari / Chrome on iOS problem:
   * When the virtual keyboard opens, `window.scrollY` shifts but
   * `getBoundingClientRect()` reports coords relative to the *visual* viewport,
   * not the layout viewport. The `visualViewport` API gives us the correct
   * offset caused by the keyboard so we can compensate.
   *
   * Also clamps the left position so the panel never overflows off the right
   * edge of the screen — critical on small phones (375px, iPhone SE).
   */
  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;

    const r = triggerRef.current.getBoundingClientRect();

    // visualViewport offset — non-zero when virtual keyboard is open on iOS/Android
    const vv = window.visualViewport;
    const offsetTop  = vv ? vv.offsetTop  : 0;
    const offsetLeft = vv ? vv.offsetLeft : 0;

    // Viewport width (use visualViewport when available — more accurate on mobile)
    const vWidth = vv ? vv.width : window.innerWidth;

    // Clamp left so the panel doesn't overflow the right screen edge
    const rawLeft  = r.left + offsetLeft;
    const maxLeft  = vWidth - PANEL_MIN_WIDTH - 8; // 8px breathing room
    const clampedLeft = Math.min(rawLeft, Math.max(0, maxLeft));

    setPanelPos({
      top:  r.bottom + 6 + offsetTop,
      left: clampedLeft,
    });
  }, []);

  useEffect(() => {
    if (isOpen) updatePos();
  }, [isOpen, updatePos]);

  // Keep panel aligned while open: window scroll/resize + iOS virtual keyboard
  useEffect(() => {
    if (!isOpen) return;

    const vv = window.visualViewport;

    window.addEventListener("scroll",  updatePos, { passive: true });
    window.addEventListener("resize",  updatePos);
    // visualViewport fires when the virtual keyboard opens/closes on iOS/Android
    vv?.addEventListener("resize", updatePos);
    vv?.addEventListener("scroll", updatePos);

    return () => {
      window.removeEventListener("scroll",  updatePos);
      window.removeEventListener("resize",  updatePos);
      vv?.removeEventListener("resize", updatePos);
      vv?.removeEventListener("scroll", updatePos);
    };
  }, [isOpen, updatePos]);

  // Close on outside tap/click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const target = ("touches" in e ? e.touches[0]?.target : e.target) as Node | null;
      if (!target) return;
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };

    // Use touchstart so the panel closes immediately on iOS without a 300ms delay
    document.addEventListener("mousedown",  onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    document.addEventListener("keydown",    onKey);
    return () => {
      document.removeEventListener("mousedown",  onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown",    onKey);
    };
  }, [isOpen, onClose]);

  const panel = (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top:  panelPos.top,
        left: panelPos.left,
        zIndex: 9999,
        // Never wider than the viewport minus a small margin
        maxWidth: "calc(100vw - 16px)",
      }}
      className="min-w-[220px] bg-cream border border-sand rounded-2xl shadow-[0_8px_32px_rgba(28,25,23,0.12)] overflow-hidden dropdown-panel"
    >
      <div className="p-2">
        {items.map((cat) => {
          const checked = activeIds.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(groupType, cat.id)}
              className={cn(
                // py-3 gives a 44px+ touch target for each row
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left",
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
              <span className="flex-1">
                {(locale === "en" && cat.name_en) ? cat.name_en : cat.name}
              </span>
              {typeof cat.count === "number" && (
                <span className="text-xs text-charcoal/30 tabular-nums">{cat.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {count > 0 && (
        <div className="border-t border-sand px-4 py-3">
          <button
            onClick={() => Array.from(activeIds).forEach((id) => onSelect(groupType, id))}
            className="text-xs text-charcoal/35 hover:text-peach transition-colors py-1"
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
        // min-h-[44px] ensures the trigger itself meets the touch target minimum
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full text-sm font-medium",
          "transition-all duration-200 whitespace-nowrap border",
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
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {mounted && isOpen && createPortal(panel, document.body)}
    </div>
  );
}
