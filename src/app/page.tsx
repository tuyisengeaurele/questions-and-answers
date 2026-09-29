"use client";

import Link from "next/link";
import { useConfirm } from "@/components/confirm-dialog";
import { useProgress } from "@/components/progress-provider";
import { questions } from "@/lib/questions";
import { summarize } from "@/lib/stats";

const tile = "press rise flex min-h-20 flex-col justify-center rounded-2xl border border-line bg-panel px-4 py-3 hover:border-mute/50";

export default function Home() {
  const { progress, dispatch, persisted } = useProgress();
  const confirm = useConfirm();
  const s = summarize(progress, questions.length);
  const pct = Math.round((s.seen / questions.length) * 100);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Ikizamini</h1>
        <p className="text-mute">Driving theory practice. Questions in Kinyarwanda.</p>
      </header>

      <div className="rounded-2xl border border-line bg-panel p-4">
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium">Questions seen</span>
          <span className="tabular text-mute">
            {s.seen} of {questions.length}
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-panel2"
          role="progressbar"
          aria-label="Questions seen"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={s.seen}
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <Link
        href="/practice"
        className="press flex min-h-16 items-center justify-center rounded-2xl bg-lime text-lg font-semibold text-on-lime"
      >
        Start practice
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/exam" className={tile}>
          <span className="font-semibold">Mock exam</span>
          <span className="text-sm text-mute">20 questions, timed</span>
        </Link>
        <Link href="/practice?filter=mistakes" className={tile}>
          <span className="font-semibold">Mistakes</span>
          <span className="tabular text-sm text-mute">{s.mistakes} to review</span>
        </Link>
        <Link href="/practice?filter=new" className={tile}>
          <span className="font-semibold">New questions</span>
          <span className="tabular text-sm text-mute">{s.unseen} left</span>
        </Link>
        <Link href="/browse" className={tile}>
          <span className="font-semibold">Browse</span>
          <span className="tabular text-sm text-mute">{questions.length} questions</span>
        </Link>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Answered", s.answered],
          ["Accuracy", `${s.accuracy}%`],
          ["Exams passed", s.examsPassed],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-panel px-1 py-3">
            <dd className="tabular text-lg font-semibold">{value}</dd>
            <dt className="text-xs text-mute">{label}</dt>
          </div>
        ))}
      </dl>

      {!persisted && (
        <p className="rounded-xl border border-line bg-panel p-3 text-sm text-mute">
          This browser is blocking storage, so progress will be lost when you close the tab.
        </p>
      )}

      <button
        onClick={async () => {
          const ok = await confirm({
            title: "Erase all progress?",
            message: "This clears your answers, mistakes and exam results on this device. It cannot be undone.",
            confirmLabel: "Erase",
            danger: true,
          });
          if (ok) dispatch({ type: "reset" });
        }}
        className="press min-h-12 w-full text-sm text-mute underline-offset-4 hover:underline"
      >
        Reset progress
      </button>
    </div>
  );
}
