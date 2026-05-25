import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchAllCategories } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { canCreateRecipe, getEntitlements } from "@/lib/entitlements";
import UserRecipeForm from "@/components/dashboard/UserRecipeForm";

export const dynamic = "force-dynamic";

export default async function NewUserRecipePage({
  searchParams,
}: {
  searchParams?: { title?: string; type?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Guard the entry point too (the server action also enforces this): if the
  // user is at their plan limit, send them back rather than letting them fill a
  // form that will be rejected on submit. No-op while monetization is off.
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);
  const { allowed } = await canCreateRecipe(user.id, count ?? 0);
  if (!allowed) redirect("/dashboard/recipes");

  const [t, categories, ent] = await Promise.all([
    getTranslations("myRecipes"),
    fetchAllCategories(),
    getEntitlements(user.id),
  ]);

  // Название и тип приходят из модалки создания (?title=…&type=food|drink).
  const presetTitle = searchParams?.title?.trim();
  const presetType = searchParams?.type === "drink" ? "drink" : "food";

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 pb-24">
      <div className="pb-8 pt-10">
        <Link
          href="/dashboard/recipes"
          className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
        >
          {t("back")}
        </Link>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
          {t("newTitle")}
        </h1>
      </div>
      <UserRecipeForm
        categories={categories}
        aiEnabled={ent.aiEnabled}
        defaultValues={{ title: presetTitle, recipe_type: presetType }}
      />
    </main>
  );
}
