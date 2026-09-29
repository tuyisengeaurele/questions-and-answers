"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLeaveGuardContext } from "@/components/leave-guard";
import { useT } from "@/components/lang-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/", label: "nav.home" },
  { href: "/practice", label: "nav.practice" },
  { href: "/exam", label: "nav.exam" },
  { href: "/browse", label: "nav.browse" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { guardClick } = useLeaveGuardContext();
  const { t } = useT();
  return (
    <nav
      aria-label={t("nav.main")}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] md:bottom-auto md:top-0 md:border-b md:border-t-0"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-1 px-2 py-2 md:px-4">
        <span className="hidden pr-4 text-lg font-semibold tracking-tight md:block">Ikizamini</span>
        <ul className="grid flex-1 grid-cols-4 gap-1 md:flex md:flex-none md:gap-2">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={(e) => guardClick(e, l.href)}
                  aria-current={active ? "page" : undefined}
                  className={`press flex min-h-12 items-center justify-center rounded-xl px-1 text-sm font-medium md:px-4 ${
                    active ? "bg-lime text-on-lime" : "text-mute hover:text-text"
                  }`}
                >
                  {t(l.label)}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="md:ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
