"use client";

interface BasicInfoSectionProps {
  title: string;
  slug: string;
  description: string;
  note: string;
  cookTime: number | null;
  servings: number | null;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onSlugEdit: () => void;
  onDescriptionChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onCookTimeChange: (v: number | null) => void;
  onServingsChange: (v: number | null) => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
      {...props}
    />
  );
}

function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal resize-none placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
      {...props}
    />
  );
}

export default function BasicInfoSection({
  title, slug, description, note, cookTime, servings,
  onTitleChange, onSlugChange, onSlugEdit, onDescriptionChange, onNoteChange,
  onCookTimeChange, onServingsChange,
}: BasicInfoSectionProps) {
  return (
    <section className="flex flex-col gap-5">
      <div>
        <FieldLabel>Название *</FieldLabel>
        <FieldInput
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Тарт с инжиром и рикоттой"
          required
        />
      </div>

      <div>
        <FieldLabel>Адрес страницы (slug) *</FieldLabel>
        <FieldInput
          value={slug}
          onChange={(e) => { onSlugChange(e.target.value); onSlugEdit(); }}
          placeholder="tart-s-inzhirom"
        />
        <p className="mt-1 text-xs text-charcoal/30">/recipes/{slug || "…"}</p>
      </div>

      <div>
        <FieldLabel>Краткое описание</FieldLabel>
        <FieldTextarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Нежный французский тарт с рикоттой, свежим инжиром и тимьяном"
        />
      </div>

      <div>
        <FieldLabel>История / заметка</FieldLabel>
        <FieldTextarea
          rows={4}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Личная история о блюде — откуда оно появилось, с чем связано..."
        />
        <p className="mt-1 text-xs text-charcoal/30">
          Отображается на странице рецепта в рукописном стиле
        </p>
      </div>

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
          <p className="mt-1 text-xs text-charcoal/30">Общее время в минутах</p>
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
          <p className="mt-1 text-xs text-charcoal/30">Для скольких человек</p>
        </div>
      </div>
    </section>
  );
}
