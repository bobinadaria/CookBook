/**
 * /admin/ingredient-requests
 *
 * Список запросов пользователей на добавление ингредиентов в базу.
 * Сгруппированы по parsed_name, отсортированы по количеству запросов — самые
 * востребованные вверху. Для каждого — кнопка-ссылка на добавление в базу.
 */
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Link from "next/link";

interface RequestGroup {
  parsed_name: string;
  original_texts: string[];
  count: number;
  last_requested_at: string;
}

async function getIngredientRequests(): Promise<RequestGroup[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("ingredient_requests")
    .select("parsed_name, original_text, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  // Группируем по parsed_name
  const groups = new Map<string, RequestGroup>();
  for (const row of data) {
    const key = row.parsed_name as string;
    if (!groups.has(key)) {
      groups.set(key, {
        parsed_name: key,
        original_texts: [],
        count: 0,
        last_requested_at: row.created_at as string,
      });
    }
    const g = groups.get(key)!;
    g.count += 1;
    const ot = row.original_text as string;
    if (!g.original_texts.includes(ot)) g.original_texts.push(ot);
  }

  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

export default async function IngredientRequestsPage() {
  const groups = await getIngredientRequests();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-soft mb-1">Админка</p>
        <h1 className="font-display text-3xl text-ink">Запросы ингредиентов</h1>
        <p className="mt-2 text-sm text-soft">
          Пользователи просили добавить эти ингредиенты в базу КБЖУ.
          Самые популярные — вверху.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center border border-dashed border-rule">
          Запросов пока нет.
        </p>
      ) : (
        <div className="border border-rule divide-y divide-rule">
          {/* Шапка */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2 text-[10px] uppercase tracking-wider text-muted bg-crust/50">
            <span>Ингредиент</span>
            <span className="text-right">Запросов</span>
            <span className="w-28" />
          </div>

          {groups.map((g) => (
            <div
              key={g.parsed_name}
              className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-4 items-start"
            >
              <div>
                <p className="text-sm font-medium text-ink">{g.parsed_name}</p>
                {g.original_texts.slice(0, 2).map((t, i) => (
                  <p key={i} className="text-xs text-muted mt-0.5">
                    «{t}»
                  </p>
                ))}
                {g.original_texts.length > 2 && (
                  <p className="text-xs text-muted mt-0.5">
                    + ещё {g.original_texts.length - 2} вариантов
                  </p>
                )}
              </div>

              <div className="text-right pt-0.5">
                <span
                  className={
                    g.count >= 5
                      ? "font-display text-xl text-burg"
                      : g.count >= 2
                        ? "font-display text-xl text-ochre-dk"
                        : "text-sm text-soft"
                  }
                >
                  {g.count}
                </span>
              </div>

              {/* Ссылка на создание ингредиента в базе */}
              <div className="w-28 flex justify-end">
                <Link
                  href={`/admin/ingredients/new?name=${encodeURIComponent(g.parsed_name)}`}
                  className="rounded-none border border-burg bg-burg text-paper px-3 py-1.5 text-xs hover:bg-burg-dk transition-colors whitespace-nowrap"
                >
                  + Добавить в базу
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="text-xs text-soft hover:text-burg transition-colors"
        >
          ← Назад в админку
        </Link>
        <span className="text-xs text-muted">
          Всего запросов: {groups.reduce((s, g) => s + g.count, 0)} · уникальных
          ингредиентов: {groups.length}
        </span>
      </div>
    </div>
  );
}
