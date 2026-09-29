"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useT } from "@/components/lang-provider";
import { QuestionCard } from "@/components/question-card";
import { useStoredPref } from "@/components/use-stored-pref";
import { HIDE_ANSWERS_KEY } from "@/lib/prefs";
import { hasImage, questions } from "@/lib/questions";
import type { OptionKey, Question } from "@/lib/types";

const PAGE = 25;
const norm = (s: string) => s.toLowerCase();

/** One question: answers shown, or hidden until you tap an option. */
function Item({ q, hidden }: { q: Question; hidden: boolean }) {
  const [picked, setPicked] = useState<OptionKey | undefined>();
  if (!hidden) return <QuestionCard question={q} reveal disabled />;
  return <QuestionCard question={q} picked={picked} reveal={picked !== undefined} disabled={picked !== undefined} onPick={setPicked} />;
}

export default function BrowsePage() {
  const { t, tn } = useT();
  const [query, setQuery] = useState("");
  const [imagesOnly, setImagesOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [hide, setHide] = useStoredPref<"on" | "off">(HIDE_ANSWERS_KEY, (v) => (v === "on" ? "on" : "off"), "off");
  const [scrolled, setScrolled] = useState(false);
  const deferred = useDeferredValue(query);
  const hidden = hide === "on";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 900);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const results = useMemo(() => {
    const q = norm(deferred.trim());
    return questions.filter((x) => {
      if (imagesOnly && !hasImage(x)) return false;
      if (!q) return true;
      return norm(x.text).includes(q) || x.options.some((o) => norm(o.text).includes(q)) || String(x.num) === q;
    });
  }, [deferred, imagesOnly]);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">{t("browse.title")}</h1>
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-bg px-4 pb-3 pt-2 md:top-16">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder={t("browse.placeholder")}
            aria-label={t("browse.searchLabel")}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 transition-colors focus:border-accent"
          />
          <button
            onClick={() => {
              setImagesOnly((v) => !v);
              setShown(PAGE);
            }}
            aria-pressed={imagesOnly}
            className={`press min-h-12 rounded-xl px-4 text-sm font-medium ${
              imagesOnly ? "bg-lime text-on-lime" : "border border-line text-mute"
            }`}
          >
            {t("browse.pictures")}
          </button>
        </div>
        <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-panel px-4">
          <span className="text-sm font-medium">{t("browse.hide")}</span>
          <input
            type="checkbox"
            role="switch"
            checked={hidden}
            onChange={(e) => setHide(e.target.checked ? "on" : "off")}
            className="size-5 accent-[var(--accent)]"
          />
        </label>
      </div>
      <p className="tabular text-sm text-mute">
        {tn("browse.count", results.length)}
        {hidden && <span> · {t("browse.hideHint")}</span>}
      </p>
      {results.length === 0 && <p className="text-mute">{t("browse.none")}</p>}
      <ol className="space-y-8">
        {results.slice(0, shown).map((q) => (
          <li key={`${q.id}-${hide}`} className="border-b border-line pb-8">
            <p className="tabular mb-2 text-sm text-mute">#{q.num}</p>
            <Item q={q} hidden={hidden} />
          </li>
        ))}
      </ol>
      {shown < results.length && (
        <button
          onClick={() => setShown((n) => n + PAGE)}
          className="press min-h-14 w-full rounded-2xl border border-line font-medium"
        >
          {t("browse.more")}
        </button>
      )}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("browse.top")}
          title={t("browse.top")}
          className="press rise fixed bottom-[calc(5.4rem+env(safe-area-inset-bottom))] right-4 z-10 flex size-12 items-center justify-center rounded-full border border-line bg-panel shadow-lg md:bottom-6"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </section>
  );
}
