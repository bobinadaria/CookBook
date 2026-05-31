"use client";

import Image from "next/image";
import { Spinner } from "@/components/ui";

interface MediaSectionProps {
  coverPreview: string | null;
  generatingCover: boolean;
  generateError: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
}

export default function MediaSection({
  coverPreview,
  generatingCover,
  generateError,
  inputRef,
  onFileChange,
  onGenerate,
}: MediaSectionProps) {
  return (
    <section>
      <label className="block text-xs text-soft uppercase tracking-wider mb-2">
        Фото обложки
      </label>

      {/* Drop zone / preview — квадрат (как и фото в рецептах) */}
      <div
        onClick={() => inputRef.current?.click()}
        className={[
          "relative w-full max-w-[360px] aspect-square rounded-none overflow-hidden cursor-pointer",
          "border-2 border-dashed border-rule hover:border-ochre-dk transition-colors",
          coverPreview ? "border-0" : "bg-crust flex items-center justify-center",
        ].join(" ")}
      >
        {coverPreview ? (
          <Image src={coverPreview} alt="cover" fill sizes="100vw" style={{ objectFit: "cover" }} />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted pointer-events-none">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">Загрузить своё фото</span>
            <span className="text-xs text-muted">или сгенерировать кнопкой ниже</span>
          </div>
        )}
        {coverPreview && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium">Заменить</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* Generate / re-generate button — доступно и при создании рецепта.
          Промпт строится по названию/составу, для напитков рисует напиток в бокале. */}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onGenerate}
          disabled={generatingCover}
          className="flex items-center gap-1.5 text-xs text-soft hover:text-ochre-dk transition-colors disabled:opacity-40"
        >
          {generatingCover ? (
            <>
              <Spinner size="sm" className="w-3.5 h-3.5 text-current" />
              Рисую обложку…
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              {coverPreview ? "Перегенерировать обложку" : "Сгенерировать обложку"}
            </>
          )}
        </button>
        {generateError && <span className="text-xs text-red-500">{generateError}</span>}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Лучшая обложка выходит, когда рецепт заполнен — по названию, составу и шагам ИИ точнее понимает блюдо.
      </p>
    </section>
  );
}
