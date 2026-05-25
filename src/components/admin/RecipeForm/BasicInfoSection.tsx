"use client";

interface BasicInfoSectionProps {
  title: string;
  slug: string;
  note: string;
  cookTime: number | null;
  servings: number | null;
  /** Напиток → скрыть поля «время приготовления» и «порции». */
  isDrink?: boolean;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onSlugEdit: () => void;
  onNoteChange: (v: string) => void;
  onCookTimeChange: (v: number | null) => void;
  onServingsChange: (v: number | null) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-soft uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full bg-crust rounded-none px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
      {...props}
    />
  );
}

function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="w-full bg-crust rounded-none px-4 py-3 text-sm text-ink resize-none placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
      {...props}
    />
  );
}

export default function BasicInfoSection({
  title, slug, note, cookTime, servings, isDrink = false,
  onTitleChange, onSlugChange, onSlugEdit, onNoteChange,
  onCookTimeChange, onServingsChange,
}: BasicInfoSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <FieldLabel>Название *</FieldLabel>
        <FieldInput
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={isDrink ? "Эспрессо-тоник" : "Тарт с инжиром и рикоттой"}
        />
      </div>

      <div>
        <FieldLabel>Адрес страницы (slug) *</FieldLabel>
        <FieldInput
          value={slug}
          onChange={(e) => { onSlugChange(e.target.value); onSlugEdit(); }}
          placeholder={isDrink ? "espresso-tonik" : "tart-s-inzhirom"}
        />
        <p className="mt-1 text-xs text-muted">/recipes/{slug || "…"}</p>
      </div>

      <div>
        <FieldLabel>История</FieldLabel>
        <FieldTextarea
          rows={5}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={
            isDrink
              ? "Личная история напитка — где попробовала, с чем ассоциируется..."
              : "Личная история о блюде — откуда оно появилось, с чем связано..."
          }
        />
        <p className="mt-1 text-xs text-muted">
          Главный текст рецепта — показывается сразу под заголовком в рукописном стиле
        </p>
      </div>

      {!isDrink && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Время приготовления (мин)</FieldLabel>
            <FieldInput
              type="number"
              min={1}
              value={cookTime ?? ""}
              onChange={(e) =>
                onCookTimeChange(e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="45"
            />
            <p className="mt-1 text-xs text-muted">Общее время в минутах</p>
          </div>
          <div>
            <FieldLabel>Количество порций</FieldLabel>
            <FieldInput
              type="number"
              min={1}
              value={servings ?? ""}
              onChange={(e) =>
                onServingsChange(e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="4"
            />
            <p className="mt-1 text-xs text-muted">Для скольких человек</p>
          </div>
        </div>
      )}
    </section>
  );
}
