import Link from "next/link";
import NewIngredientForm from "@/components/admin/NewIngredientForm";

export default async function NewIngredientPage({
  searchParams,
}: {
  searchParams?: Promise<{ name?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const presetName = sp.name?.trim() ?? "";

  return (
    <div className="flex flex-col gap-8 py-8 max-w-2xl mx-auto">
      <div>
        <Link
          href="/admin/ingredient-requests"
          className="text-xs text-soft hover:text-burg transition-colors"
        >
          ← Назад к запросам
        </Link>
        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mt-3 mb-2">
          база КБЖУ
        </span>
        <h1 className="font-display text-4xl tracking-[-0.02em] text-burg">
          Новый ингредиент
        </h1>
      </div>

      <NewIngredientForm
        presetName={presetName}
        resolvedRequestNames={presetName ? [presetName] : []}
      />
    </div>
  );
}
