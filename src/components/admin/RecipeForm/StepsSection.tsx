"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { StepInput } from "@/types";

// ── Single step row ──────────────────────────────────────────────────────────

interface StepRowProps {
  step: StepInput;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onChange: (updated: StepInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function StepRow({ step, index, isFirst, isLast, onChange, onRemove, onMoveUp, onMoveDown }: StepRowProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(step.photo_url);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange({ ...step, photoFile: file, photo_url: null });
  };

  return (
    <div className="bg-sand/50 border border-sand rounded-2xl p-4 flex gap-4">
      {/* Order + reorder controls */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
        <span className="font-serif text-2xl text-charcoal/20 leading-none w-7 text-center">
          {index + 1}
        </span>
        <button type="button" onClick={onMoveUp} disabled={isFirst}
          className="p-1 rounded text-charcoal/30 hover:text-charcoal disabled:opacity-20 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast}
          className="p-1 rounded text-charcoal/30 hover:text-charcoal disabled:opacity-20 transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 flex flex-col gap-3">
        <input
          placeholder="Заголовок шага (необязательно)"
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
          className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
        />
        <textarea
          placeholder="Описание шага *"
          value={step.description}
          rows={2}
          onChange={(e) => onChange({ ...step, description: e.target.value })}
          className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal resize-none placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
        />

        {/* Photo */}
        <div className="flex items-center gap-3">
          {preview ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src={preview} alt="step preview" fill className="object-cover" />
              <button type="button"
                onClick={() => { setPreview(null); onChange({ ...step, photoFile: undefined, photo_url: null }); }}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 text-xs text-charcoal/40 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Добавить фото
            </button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Remove */}
      <button type="button" onClick={onRemove}
        className="p-1.5 self-start rounded-lg text-charcoal/25 hover:text-red-400 hover:bg-red-50 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Steps section ────────────────────────────────────────────────────────────

interface StepsSectionProps {
  steps: StepInput[];
  onAdd: () => void;
  onUpdate: (index: number, updated: StepInput) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}

export default function StepsSection({ steps, onAdd, onUpdate, onRemove, onMove }: StepsSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <label className="block text-xs text-charcoal/40 uppercase tracking-wider">
          Шаги приготовления
        </label>
        <span className="text-xs text-charcoal/30">{steps.length} шагов</span>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {steps.map((step, i) => (
          <StepRow
            key={step.id ?? i}
            step={step}
            index={i}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
            onChange={(updated) => onUpdate(i, updated)}
            onRemove={() => onRemove(i)}
            onMoveUp={() => onMove(i, -1)}
            onMoveDown={() => onMove(i, 1)}
          />
        ))}
      </div>

      <button type="button" onClick={onAdd}
        className="flex items-center gap-2 text-sm text-charcoal/50 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-4 py-3 w-full justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Добавить шаг
      </button>
    </section>
  );
}
