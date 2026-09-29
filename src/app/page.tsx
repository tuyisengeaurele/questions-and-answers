"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConfirm } from "@/components/confirm-dialog";
import { InstallButton } from "@/components/install-button";
import { useT } from "@/components/lang-provider";
import { useProgress } from "@/components/progress-provider";
import { RecentExams } from "@/components/recent-exams";
import { useStoredPref } from "@/components/use-stored-pref";
import { LANGS } from "@/lib/i18n";
import { questionCount } from "@/lib/meta";
import { OFFLINE_KEY, parseSize, SIZE_KEY, type TextSize } from "@/lib/prefs";
import { summarize } from "@/lib/stats";

const tile = "press rise flex min-h-20 flex-col justify-center rounded-2xl border border-line bg-panel px-4 py-3 hover:border-mute/50";

export default function Home() {
  const { t, lang, setLang } = useT();
  const { progress, dispatch, persisted, ready } = useProgress();
  const confirm = useConfirm();
  const [size, setSize] = useStoredPref<TextSize>(SIZE_KEY, parseSize, "normal");
  const [offlineReady] = useStoredPref<"1" | "0">(OFFLINE_KEY, (v) => (v === "1" ? "1" : "0"), "0");
  const [now, setNow] = useState(0);
  const s = summarize(progress, questionCount);
  const pct = ready ? Math.round((s.seen / questionCount) * 100) : 0;
  // Until saved progress has loaded, show dashes instead of a misleading zero.
  const num = (value: string | number) => (ready ? value : "–");

  useEffect(() => {
    if (size === "large") document.documentElement.dataset.size = "large";
    else delete document.documentElement.dataset.size;
  }, [size]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is read after mount so server and client agree
    setNow(Date.now());
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Ikizamini</h1>
        <p className="text-mute">{t("home.tagline")}</p>
      </header>

      <div className="rounded-2xl border border-line bg-panel p-4">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium">{t("home.seen")}</span>
          <span className="tabular text-mute">{ready ? t("home.seenOf", { seen: s.seen, total: questionCount }) : "–"}</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-panel2"
          role="progressbar"
          aria-label={t("home.seen")}
          aria-valuemin={0}
          aria-valuemax={questionCount}
          aria-valuenow={s.seen}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Link
        href="/practice"
        className="press flex min-h-16 items-center justify-center rounded-2xl bg-lime text-lg font-semibold text-on-lime"
      >
        {t("home.start")}
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/exam" className={tile}>
          <span className="font-semibold">{t("tile.exam")}</span>
          <span className="text-sm text-mute">{t("tile.examSub")}</span>
        </Link>
        <Link href="/practice?filter=mistakes" className={tile}>
          <span className="font-semibold">{t("tile.mistakes")}</span>
          <span className="tabular text-sm text-mute">{ready ? t("tile.mistakesSub", { n: s.mistakes }) : "–"}</span>
        </Link>
        <Link href="/practice?filter=new" className={tile}>
          <span className="font-semibold">{t("tile.new")}</span>
          <span className="tabular text-sm text-mute">{ready ? t("tile.newSub", { n: s.unseen }) : "–"}</span>
        </Link>
        <Link href="/browse" className={tile}>
          <span className="font-semibold">{t("tile.browse")}</span>
          <span className="tabular text-sm text-mute">{t("tile.browseSub", { n: questionCount })}</span>
        </Link>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          [t("stat.answered"), num(s.answered)],
          [t("stat.accuracy"), num(`${s.accuracy}%`)],
          [t("stat.passed"), num(s.examsPassed)],
        ].map(([label, value]) => (
          <div key={label} className="flex flex-col-reverse rounded-xl bg-panel px-1 py-3">
            <dt className="text-xs text-mute">{label}</dt>
            <dd className="tabular text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <RecentExams exams={progress.exams} now={now} />

      {!persisted && (
        <p className="rounded-xl border border-line bg-panel p-3 text-sm text-mute">{t("home.storageBlocked")}</p>
      )}

      <section aria-labelledby="settings-title" className="space-y-4 rounded-2xl border border-line bg-panel p-4">
        <h2 id="settings-title" className="text-sm font-medium text-mute">
          {t("settings.title")}
        </h2>
        <div>
          <p className="mb-2 text-sm">{t("settings.textSize")}</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-panel2 p-1">
            {(["normal", "large"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSize(v)}
                aria-pressed={size === v}
                className={`press min-h-12 rounded-lg text-sm font-medium ${size === v ? "bg-lime text-on-lime" : "text-mute"}`}
              >
                {t(`size.${v}` as const)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm">{t("settings.language")}</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-panel2 p-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                lang={l.code}
                className={`press min-h-12 rounded-lg text-sm font-medium ${lang === l.code ? "bg-lime text-on-lime" : "text-mute"}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">{t("settings.languageNote")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <InstallButton />
          {offlineReady === "1" && <span className="text-sm text-accent">{t("offline.ready")}</span>}
        </div>
      </section>

      <button
        onClick={async () => {
          const ok = await confirm({
            title: t("reset.title"),
            message: t("reset.message"),
            confirmLabel: t("reset.confirm"),
            danger: true,
          });
          if (ok) dispatch({ type: "reset" });
        }}
        className="press min-h-12 w-full text-sm text-mute underline-offset-4 hover:underline"
      >
        {t("home.reset")}
      </button>
    </div>
  );
}
