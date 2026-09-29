"use client";

import { useState } from "react";
import { QuestionCard } from "@/components/question-card";
import { useProgress } from "@/components/progress-provider";
import type { OptionKey, Question } from "@/lib/types";

export function Round({ questions, onExit }: { questions: Question[]; onExit: () => void }) {
  const { dispatch } = useProgress();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<OptionKey | undefined>();
  const [done, setDone] = useState(false);
  const [right, setRight] = useState(0);
  const [picks, setPicks] = useState<Record<number, OptionKey>>({});
  const q = questions[i];

  function pick(key: OptionKey) {
    if (picked) return;
    const ok = key === q.answer;
    setPicks((p) => ({ ...p, [q.id]: key }));
    setPicked(key);
    if (ok) setRight((r) => r + 1);
    dispatch({ type: "answer", id: q.id, correct: ok });
  }

  function next() {
    if (i + 1 >= questions.length) {
      setDone(true);
    } else {
      setI(i + 1);
      setPicked(undefined);
    }
  }

  if (done) {
    const missed = questions.filter((x) => picks[x.id] !== x.answer);
    return (
      <section className="space-y-8">
        <div className="rise space-y-2 pt-4 text-center">
          <p className="text-sm text-mute">Round finished</p>
          <p className="tabular text-6xl font-semibold">
            {right}
            <span className="text-mute">/{questions.length}</span>
          </p>
        </div>
        <button onClick={onExit} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
          Back to practice
        </button>
        {missed.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Review what you missed</h2>
            <ol className="space-y-8">
              {missed.map((m) => (
                <li key={m.id} className="rise border-b border-line pb-8">
                  <QuestionCard question={m} picked={picks[m.id]} reveal disabled />
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-center text-mute">Nothing missed. Clean round.</p>
        )}
      </section>
    );
  }

  return (
    <section>
      <header className="mb-5 flex items-center gap-4">
        <button onClick={onExit} className="press min-h-12 pr-2 text-sm text-mute">
          Quit
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel2" aria-hidden>
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-300 ease-out"
            style={{ width: `${((i + (picked ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="tabular text-sm text-mute">
          {i + 1}/{questions.length}
        </span>
      </header>
      <QuestionCard
        key={q.id}
        question={q}
        picked={picked}
        reveal={picked !== undefined}
        disabled={picked !== undefined}
        onPick={pick}
      />
      <div className="mt-6 min-h-14">
        {picked && (
          <button onClick={next} className="press rise min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
            {i + 1 >= questions.length ? "Finish" : "Next"}
          </button>
        )}
      </div>
    </section>
  );
}
