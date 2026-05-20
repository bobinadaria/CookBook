import Link from "next/link";
import { cn } from "@/lib/utils";

export type EditorialButtonVariant = "solid" | "ghost" | "ochre" | "paper";

const base =
  "inline-flex items-center justify-center gap-2 rounded-none px-7 py-[15px] font-body text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<EditorialButtonVariant, string> = {
  solid: "border-0 bg-burg text-paper hover:bg-burg-dk",
  ghost: "border-[1.5px] border-burg bg-transparent text-burg hover:bg-burg hover:text-paper",
  ochre: "border-0 bg-ochre text-burg hover:bg-ochre-dk",
  paper: "border-0 bg-paper text-burg hover:bg-crust",
};

interface CommonProps {
  variant?: EditorialButtonVariant;
  className?: string;
  children: React.ReactNode;
}

type ButtonOnlyProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkOnlyProps = CommonProps & {
  href: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/**
 * EditorialButton — magazine-кнопка (прямые углы, caps, Work Sans).
 * Рендерит <Link>, если передан href, иначе <button>.
 * Это НОВАЯ кнопка для редизайна; старый ui/Button остаётся для legacy-экранов
 * (админка, кабинет, auth) до шага 14-15 миграции.
 */
export default function EditorialButton(props: ButtonOnlyProps | LinkOnlyProps) {
  const { variant = "solid", className, children, ...rest } = props;
  const cls = cn(base, variants[variant], className);

  if ("href" in props && props.href !== undefined) {
    return (
      <Link
        className={cls}
        {...(rest as { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
