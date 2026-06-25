import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { Eyebrow } from "@/components/ui";
import ProfileBlock from "@/components/dashboard/ProfileBlock";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, entitlements, t] = await Promise.all([
    supabase.from("profiles").select("display_name, plan").eq("id", user.id).maybeSingle(),
    getEntitlements(user.id),
    getTranslations("nav"),
  ]);

  const rawPlan = profileRes.data?.plan;
  const plan: "free" | "premium" | "lifetime" =
    rawPlan === "premium" || rawPlan === "lifetime" ? rawPlan : "free";
  const displayName = profileRes.data?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <main className="mx-auto max-w-[1320px] px-6 pb-24 md:px-10 lg:px-14">
      <div className="pb-8 pt-10">
        <Eyebrow color="text-ochre-dk">{t("myProfile")}</Eyebrow>
      </div>

      <ProfileBlock
        userId={user.id}
        email={user.email ?? ""}
        initialDisplayName={displayName}
        plan={plan}
        coverCredits={entitlements.credits.covers}
      />
    </main>
  );
}
