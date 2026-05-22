import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { EditorialButton, Eyebrow } from "@/components/ui";

// User-specific data — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function MyRecipesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, recipesRes, entitlements] = await Promise.all([
    getTranslations("myRecipes"),
    supabase
      .from("recipes")
      .select("id, title, cover_image, created_at")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
    getEntitlements(user.id),
  ]);

  const list = recipesRes.data ?? [];
  const { limits, monetizationEnabled } = entitlements;
  const atLimit =
    monetizationEnabled && limits.recipes !== null && list.length >= limits.recipes;

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-6 pb-8 pt-10">
        <div>
          <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,5vw,3.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
            {t("title")}
          </h1>
        </div>
        {atLimit ? (
          <EditorialButton type="button" disabled className="px-6 py-3">
            {t("addRecipe")}
          </EditorialButton>
        ) : (
          <EditorialButton href="/dashboard/recipes/new" className="px-6 py-3">
            {t("addRecipe")}
          </EditorialButton>
        )}
      </div>

      {monetizationEnabled && limits.recipes !== null && (
        <p className="mb-6 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
          {t("limitCount", { count: list.length, limit: limits.recipes })}
        </p>
      )}

      {atLimit && (
        <p className="mb-6 font-body text-sm text-soft">
          {t("errLimit", { limit: limits.recipes ?? "" })}
        </p>
      )}

      {list.length === 0 ? (
        <div className="border-t border-rule py-28 text-center">
          <p className="mb-4 font-display text-[28px] italic text-burg/40">{t("empty")}</p>
          <p className="mb-8 font-body text-sm text-soft">{t("emptyHint")}</p>
          <div className="flex justify-center">
            <EditorialButton href="/dashboard/recipes/new">{t("addRecipe")}</EditorialButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
          {list.map((r) => (
            <Link key={r.id} href={`/dashboard/recipes/${r.id}`} className="group">
              <div className="relative mb-3 aspect-[4/3] overflow-hidden bg-crust">
                {r.cover_image ? (
                  <Image
                    src={r.cover_image}
                    alt=""
                    fill
                    sizes="(max-width:1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-3xl italic text-burg/20">
                    {t("noCover")}
                  </div>
                )}
              </div>
              <h2 className="font-display text-xl leading-tight text-burg transition-colors group-hover:text-ochre-dk">
                {r.title}
              </h2>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
