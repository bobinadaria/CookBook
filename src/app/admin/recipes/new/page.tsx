import RecipeForm from "@/components/admin/RecipeForm";

export default function NewRecipePage() {
  return (
    <div>
      <span className="font-handwritten text-peach text-xl block mb-2">новый рецепт</span>
      <h1 className="font-serif text-4xl text-charcoal mb-10">Создать рецепт</h1>
      <RecipeForm />
    </div>
  );
}
