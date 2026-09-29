"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useT } from "@/components/lang-provider";
import { useProgress } from "@/components/progress-provider";
import { ResumeCard } from "@/components/resume-card";
import { Round } from "@/components/round";
import { DEFAULT_ROUND_SIZE, ROUND_SIZES, roundMinImages } from "@/lib/constants";
import { mistakeIds, seenIds } from "@/lib/progress";
import { byId, questions } from "@/lib/questions";
import { pickRound } from "@/lib/selector";
import { clearResume, loadRound, type RoundSave } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import type { Question } from "@/lib/types";

type Filter = "all" | "new" | "mistakes";
const FILTERS = ["all", "new", "mistakes"] as const;

interface Active {
  questions: Question[];
  initial?: RoundSave;
  /** Only rounds picked from the whole pool advance the practice cycle. */
  cycle: boolean;
}

function Practice() {
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const filter: Filter = FILTERS.find((f) => f === params.get("filter")) ?? "all";
  const [size, setSize] = useState<number>(DEFAULT_ROUND_SIZE);
  const [active, setActive] = useState<Active | null>(null);
  const [runId, setRunId] = useState(0);
  const [saved, setSaved] = useState<RoundSave | null>(null);
  const { progress, dispatch, ready } = useProgress();

  useEffect(() => {
    // Read after mount: the saved round lives in this browser only.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setSaved(loadRound(getStorage(), Date.now(), (id) => byId.has(id)));
  }, []);

  const pool = useMemo(() => {
    if (filter === "mistakes") {
      const ids = new Set(mistakeIds(progress));
      return questions.filter((q) => ids.has(q.id));
    }
    if (filter === "new") {
      const seen = seenIds(progress);
      return questions.filter((q) => !seen.has(q.id));
    }
    return questions;
  }, [filter, progress]);

  function begin(next: Active) {
    setActive(next);
    setRunId((n) => n + 1);
    setSaved(null);
  }

  function start() {
    const used = filter === "all" ? progress.cycle : [];
    const picked = pickRound(pool, used, size, roundMinImages(size));
    if (filter === "all") dispatch({ type: "cycle", ids: picked.used });
    begin({ questions: picked.round, cycle: filter === "all" });
  }

  function resume(s: RoundSave) {
    begin({ questions: s.ids.map((id) => byId.get(id)!), initial: s, cycle: false });
  }

  function leave(unanswered: number[]) {
    // Questions never reached go back into the pool for this pass.
    if (active?.cycle && unanswered.length) {
      dispatch({ type: "cycle", ids: progress.cycle.filter((id) => !unanswered.includes(id)) });
    }
    setActive(null);
  }

  if (active) {
    return (
      <Round
        key={runId}
        questions={active.questions}
        initial={active.initial}
        onExit={leave}
        onRetry={(missed) => begin({ questions: missed, cycle: false })}
      />
    );
  }

  const emptyText = filter === "mistakes" ? t("practice.emptyMistakes") : t("practice.emptyNew");

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("practice.title")}</h1>
      {saved && (
        <ResumeCard
          title={t("resume.roundTitle")}
          detail={t("resume.roundSub", { i: saved.index + 1, n: saved.ids.length })}
          onResume={() => resume(saved)}
          onDiscard={() => {
            clearResume(getStorage(), "round");
            setSaved(null);
          }}
        />
      )}
      <p className="text-mute">{t("practice.intro", { n: size })}</p>
      <div role="tablist" aria-label={t("practice.filterLabel")} className="grid grid-cols-3 gap-1 rounded-2xl bg-panel p-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => router.replace(f === "all" ? "/practice" : `/practice?filter=${f}`, { scroll: false })}
            className={`press min-h-12 rounded-xl text-sm font-medium ${filter === f ? "bg-lime text-on-lime" : "text-mute"}`}
          >
            {t(`filter.${f}` as const)}
          </button>
        ))}
      </div>
      {filter === "mistakes" && <p className="text-sm text-mute">{t("practice.mistakeRule")}</p>}
      <div>
        <p className="mb-2 text-sm text-mute">{t("practice.length")}</p>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-panel p-1">
          {ROUND_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              aria-pressed={size === n}
              className={`press tabular min-h-12 rounded-xl text-sm font-medium ${size === n ? "bg-lime text-on-lime" : "text-mute"}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {ready && pool.length === 0 ? (
        <p className="rise rounded-2xl border border-line bg-panel p-5 text-mute">{emptyText}</p>
      ) : (
        <button
          onClick={start}
          disabled={!ready}
          className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime disabled:opacity-50"
        >
          {t("practice.start", { n: Math.min(size, pool.length) })}
        </button>
      )}
    </section>
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}
