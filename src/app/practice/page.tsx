"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProgress } from "@/components/progress-provider";
import { Round } from "@/components/round";
import { ROUND_MIN_IMAGES, ROUND_SIZE } from "@/lib/constants";
import { mistakeIds, seenIds } from "@/lib/progress";
import { questions } from "@/lib/questions";
import { pickRound } from "@/lib/selector";
import type { Question } from "@/lib/types";

type Filter = "all" | "new" | "mistakes";
const labels: Record<Filter, string> = { all: "All", new: "New", mistakes: "Mistakes" };

function Practice() {
  const params = useSearchParams();
  const initial = (["all", "new", "mistakes"] as const).find((f) => f === params.get("filter")) ?? "all";
  const [filter, setFilter] = useState<Filter>(initial);
  const [round, setRound] = useState<Question[] | null>(null);
  const [runId, setRunId] = useState(0);
  const { progress, dispatch, ready } = useProgress();

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

  function start() {
    const used = filter === "all" ? progress.cycle : [];
    const picked = pickRound(pool, used, ROUND_SIZE, ROUND_MIN_IMAGES);
    if (filter === "all") dispatch({ type: "cycle", ids: picked.used });
    setRound(picked.round);
    setRunId((n) => n + 1);
  }

  if (round) {
    return <Round key={runId} questions={round} onExit={() => setRound(null)} />;
  }

  const emptyText =
    filter === "mistakes"
      ? "No mistakes waiting. Play a round and anything you miss will show up here."
      : "You have seen every question. Switch to All to keep going.";

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
      <p className="text-mute">Rounds of {ROUND_SIZE} questions. You see the right answer straight away.</p>
      <div role="tablist" aria-label="Which questions" className="grid grid-cols-3 gap-1 rounded-2xl bg-panel p-1">
        {(Object.keys(labels) as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`press min-h-12 rounded-xl text-sm font-medium ${filter === f ? "bg-lime text-on-lime" : "text-mute"}`}
          >
            {labels[f]}
          </button>
        ))}
      </div>
      {ready && pool.length === 0 ? (
        <p className="rise rounded-2xl border border-line bg-panel p-5 text-mute">{emptyText}</p>
      ) : (
        <button
          onClick={start}
          disabled={!ready}
          className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime disabled:opacity-50"
        >
          Start round <span className="tabular opacity-70">({Math.min(ROUND_SIZE, pool.length)})</span>
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
