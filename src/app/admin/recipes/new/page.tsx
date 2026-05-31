import RecipeForm from "@/components/admin/RecipeForm";

// Название и тип приходят из быстрого создания (модалка «Новый») через
// ?title=…&type=food|drink.
export default async function NewRecipePage({
  searchParams,
}: {
  searchParams?: Promise<{ title?: string; type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const presetTitle = sp.title?.trim();
  const presetType = sp.type === "drink" ? "drink" : "food";

  const defaults =
    presetTitle || sp.type
      ? { ...(presetTitle ? { title: presetTitle } : {}), recipe_type: presetType as "food" | "drink" }
      : undefined;

  return (
    <div>
      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">новый рецепт</span>
      <h1 className="font-display text-4xl tracking-[-0.02em] text-burg mb-10">Создать рецепт</h1>
      <RecipeForm defaultValues={defaults} />
    </div>
  );
}
