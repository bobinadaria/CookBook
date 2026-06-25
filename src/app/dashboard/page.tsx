import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { Eyebrow } from "@/components/ui";
import MyBookView, { type BookItem } from "@/components/dashboard/MyBookView";
import MyBookEmptyState from "@/components/dashboard/MyBookEmptyState";
import CreateRecipeButton from "@/components/dashboard/CreateRecipeButton";

// Персональные данные — никогда не кешировать статически.
export const dynamic = "force-dynamic";

/** Ключ приветствия по часу (UTC; для более точного — нужен клиент, но UTC достаточно). */
function greetingKey(): "greetingMorning" | "greetingDay" | "greetingEvening" | "greetingNight" {
  const h = new Date().getUTCHours();
  if (h >= 5 && h < 12) return "greetingMorning";
  if (h >= 12 && h < 18) return "greetingDay";
  if (h >= 18 && h < 23) return "greetingEvening";
  return "greetingNight";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, profileRes, ownRes, favRes, entitlements] = await Promise.all([
    getTranslations("myRecipes"),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle(),
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

  const displayName =
    profileRes.data?.display_name ?? user.email?.split("@")[0] ?? "";

  // Свои рецепты
  const own = ownRes.data ?? [];

  // Сохранённые (избранное)
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
    const order = new Map(favSlugs.map((s, i) => [s, i]));
    saved.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  }

  const items: BookItem[] = [
    ...own.map((r) => ({
      id: r.id as string,
      kind: "own" as const,
      href: `/dashboard/recipes/${r.id as string}`,
      slug: null,
      title: r.title as string,
      title_en: (r.title_en as string | null) ?? null,
      cover_image: (r.cover_image as string | null) ?? null,
    })),
    ...saved.map((r) => ({
      id: r.id,
      kind: "saved" as const,
      href: `/recipes/${r.slug}`,
      slug: r.slug,
      title: r.title,
      title_en: r.title_en,
      cover_image: r.cover_image,
    })),
  ];

  const { limits, monetizationEnabled } = entitlements;
  const atLimit =
    monetizationEnabled && limits.recipes !== null && own.length >= limits.recipes;

  const td = await getTranslations("dashboard");

  return (
    <main className="mx-auto min-h-dvh max-w-[1320px] px-6 pb-24 md:px-10 lg:px-14">
      {/* Приветствие + кнопка создания */}
      <div className="flex flex-wrap items-end justify-between gap-6 pb-8 pt-10">
        <div>
          <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,6vw,72px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
            {td(greetingKey(), { name: displayName })}
          </h1>
          <p className="mt-2 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
            {t("myBookPrivacyNote")}
          </p>
        </div>
        <CreateRecipeButton
          disabled={atLimit}
          className="px-6 py-3"
          aiEnabled={entitlements.aiEnabled}
        />
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

      {/* Рецепты */}
      {items.length === 0 ? (
        <MyBookEmptyState aiEnabled={entitlements.aiEnabled} />
      ) : (
        <MyBookView items={items} />
      )}

    </main>
  );
}
