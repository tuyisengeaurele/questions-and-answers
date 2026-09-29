"use client";

import Link from "next/link";
import { useT } from "@/components/lang-provider";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <section className="space-y-4 pt-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("error.title")}</h1>
      <p className="text-mute">{t("error.body")}</p>
      <div className="grid gap-3 pt-2">
        <button onClick={reset} className="press min-h-14 rounded-2xl bg-lime font-semibold text-on-lime">
          {t("error.retry")}
        </button>
        <Link href="/" className="press flex min-h-14 items-center justify-center rounded-2xl border border-line font-medium">
          {t("error.home")}
        </Link>
      </div>
    </section>
  );
}
