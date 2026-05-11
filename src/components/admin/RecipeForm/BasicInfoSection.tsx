"use client";

interface BasicInfoSectionProps {
  title: string;
  slug: string;
  description: string;
  note: string;
  onTitleChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  onSlugEdit: () => void;
  onDescriptionChange: (v: string) => void;
  onNoteChange: (v: string) => void;
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
  title, slug, description, note,
  onTitleChange, onSlugChange, onSlugEdit, onDescriptionChange, onNoteChange,
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
        <FieldLabel>Slug (URL) *</FieldLabel>
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
    </section>
  );
}
