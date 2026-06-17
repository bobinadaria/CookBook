import { redirect } from "next/navigation";

/**
 * Старый дашборд «Обзор» объединён со списком рецептов: счётчики (Рецептов/
 * Опубликовано) теперь живут наверху /admin/recipes. Этот индекс просто
 * перенаправляет туда, чтобы /admin продолжал работать.
 */
export default function AdminIndexPage() {
  redirect("/admin/recipes");
}
