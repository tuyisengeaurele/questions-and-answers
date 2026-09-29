"use client";

import Link from "next/link";
import { useT } from "@/components/lang-provider";

export default function NotFound() {
  const { t } = useT();
  return (
    <section className="space-y-4 pt-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("notfound.title")}</h1>
      <p className="text-mute">{t("notfound.body")}</p>
      <Link href="/" className="press mt-2 flex min-h-14 items-center justify-center rounded-2xl bg-lime font-semibold text-on-lime">
        {t("error.home")}
      </Link>
    </section>
  );
}
