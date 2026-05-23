import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { EditorialButton } from "@/components/ui";

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

interface FooterLink {
  href: string;
  label: string;
}

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <div className="mb-4 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-ochre">
        {title}
      </div>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="font-body text-[13px] text-section-soft transition-colors hover:text-section-fg"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function Footer() {
  const t = await getTranslations("nav");
  const tf = await getTranslations("footer");
  const year = toRoman(new Date().getFullYear());

  return (
    <footer className="mt-20 bg-section px-6 pb-9 pt-[72px] text-section-fg lg:px-14">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 gap-12 border-b border-section-rule pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand block */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h2 className="font-display text-[56px] font-normal italic leading-[0.95] tracking-[-0.02em] text-ochre">
              The Slow Table
            </h2>
            <p className="mt-1 font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-section-soft">
              by Daria
            </p>
            <div className="mt-[22px]">
              <EditorialButton variant="ochre" href="/pricing" className="px-[22px] py-3 text-[11px]">
                {tf("getIssue")}
              </EditorialButton>
            </div>
          </div>

          <FooterCol
            title={tf("book")}
            links={[
              { href: "/recipes", label: t("recipes") },
              { href: "/pricing", label: t("pricing") },
            ]}
          />
          <FooterCol
            title={tf("account")}
            links={[
              { href: "/login", label: t("signIn") },
              { href: "/register", label: t("register") },
              { href: "/dashboard/recipes", label: t("myBook") },
            ]}
          />
          <FooterCol
            title={tf("contact")}
            links={[{ href: "mailto:hello@bydaria.kitchen", label: "hello@bydaria.kitchen" }]}
          />
        </div>

        <div className="flex flex-col gap-2 pt-6 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-section-soft sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {year} — {tf("author")} &middot; bydaria.kitchen &middot; {tf("rights")}
          </span>
          <span>Praha &middot; {year}</span>
        </div>
      </div>
    </footer>
  );
}
