import RecipeForm from "@/components/admin/RecipeForm";

export default function NewRecipePage() {
  return (
    <div>
      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">новый рецепт</span>
      <h1 className="font-display text-4xl tracking-[-0.02em] text-burg mb-10">Создать рецепт</h1>
      <RecipeForm />
    </div>
  );
}
