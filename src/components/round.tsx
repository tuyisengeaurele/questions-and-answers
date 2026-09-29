"use client";

import { useState } from "react";
import { ActionBar, ActionBarSpacer } from "@/components/action-bar";
import { useConfirm } from "@/components/confirm-dialog";
import { useT } from "@/components/lang-provider";
import { useLeaveGuard } from "@/components/leave-guard";
import { useProgress } from "@/components/progress-provider";
import { QuestionCard } from "@/components/question-card";
import { focusIsOnControl, useKeys } from "@/components/use-keys";
import { optionIndexForKey } from "@/lib/keys";
import { clearResume, saveResume } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import type { OptionKey, Question } from "@/lib/types";

interface Props {
  questions: Question[];
  /** Where a resumed round picks up. */
  initial?: { index: number; picks: Record<number, OptionKey> };
  /** Called when the round ends or is quit; `unanswered` are the questions never reached. */
  onExit: (unanswered: number[]) => void;
  /** Start a new round from the questions missed here. */
  onRetry?: (missed: Question[]) => void;
  /** Keep the round so it can be resumed after a refresh. */
  persist?: boolean;
}

export function Round({ questions, initial, onExit, onRetry, persist = true }: Props) {
  const { t } = useT();
  const { dispatch } = useProgress();
  const confirm = useConfirm();
  const [i, setI] = useState(initial?.index ?? 0);
  const [picks, setPicks] = useState<Record<number, OptionKey>>(initial?.picks ?? {});
  const [done, setDone] = useState(false);
  const q = questions[i];
  const picked = picks[q.id] as OptionKey | undefined;
  const right = questions.filter((x) => picks[x.id] === x.answer).length;

  useLeaveGuard(!done, { title: t("leave.roundTitle"), message: t("leave.roundMessage") });

  function remember(index: number, nextPicks: Record<number, OptionKey>) {
    if (persist) saveResume(getStorage(), "round", { ids: questions.map((x) => x.id), index, picks: nextPicks, savedAt: Date.now() });
  }

  function pick(key: OptionKey) {
    if (picked) return;
    const ok = key === q.answer;
    const next = { ...picks, [q.id]: key };
    setPicks(next);
    remember(i, next);
    if (!ok) navigator.vibrate?.(40);
    dispatch({ type: "answer", id: q.id, correct: ok });
  }

  function next() {
    if (i + 1 >= questions.length) {
      clearResume(getStorage(), "round");
      setDone(true);
    } else {
      setI(i + 1);
      remember(i + 1, picks);
    }
  }

  async function quit() {
    const ok = await confirm({
      title: t("quit.title"),
      message: t("quit.message"),
      confirmLabel: t("quit.confirm"),
      cancelLabel: t("quit.stay"),
    });
    if (!ok) return;
    clearResume(getStorage(), "round");
    onExit(questions.filter((x) => !picks[x.id]).map((x) => x.id));
  }

  useKeys((e) => {
    if (done) return;
    const index = optionIndexForKey(e.key, q.options.length);
    if (index !== null) {
      e.preventDefault();
      pick(q.options[index].key);
    } else if (picked && (e.key === "ArrowRight" || ((e.key === "Enter" || e.key === " ") && !focusIsOnControl()))) {
      e.preventDefault();
      next();
    }
  });

  if (done) {
    const missed = questions.filter((x) => picks[x.id] !== x.answer);
    return (
      <section className="space-y-8">
        <div className="rise space-y-2 pt-4 text-center">
          <p className="text-sm text-mute">{t("round.finished")}</p>
          <p className="tabular text-6xl font-semibold">
            {right}
            <span className="text-mute">/{questions.length}</span>
          </p>
        </div>
        <div className="grid gap-3">
          {missed.length > 0 && onRetry && (
            <button onClick={() => onRetry(missed)} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
              {t("round.retry")}
            </button>
          )}
          <button
            onClick={() => onExit([])}
            className={`press min-h-14 w-full rounded-2xl font-semibold ${
              missed.length > 0 && onRetry ? "border border-line" : "bg-lime text-on-lime"
            }`}
          >
            {t("round.back")}
          </button>
        </div>
        {missed.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">{t("round.review")}</h2>
            <ol className="space-y-8">
              {missed.map((m) => (
                <li key={m.id} className="rise border-b border-line pb-8">
                  <QuestionCard question={m} picked={picks[m.id]} reveal disabled />
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="text-center text-mute">{t("round.clean")}</p>
        )}
      </section>
    );
  }

  return (
    <section>
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-4 bg-bg px-4 py-2 md:top-16">
        <button onClick={quit} className="press min-h-12 min-w-12 pr-2 text-left text-sm text-mute">
          {t("round.quit")}
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-panel2" aria-hidden>
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
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
        focusOnMount={i > 0}
      />
      <p role="status" className="sr-only">
        {picked ? (picked === q.answer ? t("answer.correct") : t("answer.wrong", { key: q.answer.toUpperCase() })) : ""}
      </p>
      <ActionBarSpacer />
      {picked && (
        <ActionBar>
          <button onClick={next} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
            {i + 1 >= questions.length ? t("round.finish") : t("round.next")}
          </button>
        </ActionBar>
      )}
    </section>
  );
}
