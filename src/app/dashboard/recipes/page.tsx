import { redirect } from "next/navigation";

/**
 * /dashboard/recipes теперь объединена с /dashboard (одна страница).
 * Все старые ссылки автоматически попадают на объединённый дашборд.
 */
export default function RecipesRedirectPage() {
  redirect("/dashboard");
}
