import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { Eyebrow } from "@/components/ui";
import MyBookView, { type BookItem } from "@/components/dashboard/MyBookView";
import MyBookEmptyState from "@/components/dashboard/MyBookEmptyState";
import CreateRecipeButton from "@/components/dashboard/CreateRecipeButton";

// User-specific data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function MyBookPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, ownRes, favRes, entitlements] = await Promise.all([
    getTranslations("myRecipes"),
    supabase
      .from("recipes")
      .select("id, title, title_en, cover_image, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("favorites")
      .select("recipe_slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    getEntitlements(user.id),
  ]);

  const own = ownRes.data ?? [];

  // Сохранённые (бывшее «Избранное») — публичные рецепты каталога по слагам.
  const favSlugs = (favRes.data ?? []).map((f) => f.recipe_slug as string);
  let saved: {
    id: string;
    title: string;
    title_en: string | null;
    slug: string;
    cover_image: string | null;
  }[] = [];
  if (favSlugs.length > 0) {
    const { data } = await supabase
      .from("recipes")
      .select("id, title, title_en, slug, cover_image")
      .eq("visibility", "public")
      .eq("published", true)
      .in("slug", favSlugs);
    saved = data ?? [];
    // Сохраняем порядок добавления в избранное (favRes уже отсортирован по дате).
    const order = new Map(favSlugs.map((s, i) => [s, i]));
    saved.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  }

  const items: BookItem[] = [
    ...own.map((r) => ({
      id: r.id as string,
      kind: "own" as const,
      href: `/dashboard/recipes/${r.id as string}`,
      title: r.title as string,
      title_en: (r.title_en as string | null) ?? null,
      cover_image: (r.cover_image as string | null) ?? null,
    })),
    ...saved.map((r) => ({
      id: r.id,
      kind: "saved" as const,
      href: `/recipes/${r.slug}`,
      title: r.title,
      title_en: r.title_en,
      cover_image: r.cover_image,
    })),
  ];

  const { limits, monetizationEnabled } = entitlements;
  const atLimit =
    monetizationEnabled && limits.recipes !== null && own.length >= limits.recipes;

  return (
    <main className="mx-auto min-h-dvh max-w-[1320px] px-6 pb-24 md:px-10 lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6 pb-8 pt-10">
        <div>
          <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,6vw,72px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
            {t("title")}
          </h1>
        </div>
        <CreateRecipeButton disabled={atLimit} className="px-6 py-3" />
      </div>

      {monetizationEnabled && limits.recipes !== null && (
        <p className="mb-6 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
          {t("limitCount", { count: own.length, limit: limits.recipes })}
        </p>
      )}

      {atLimit && (
        <p className="mb-6 font-body text-sm text-soft">
          {t("errLimit", { limit: limits.recipes ?? "" })}
        </p>
      )}

      {items.length === 0 ? (
        <MyBookEmptyState />
      ) : (
        <MyBookView items={items} />
      )}
    </main>
  );
}
