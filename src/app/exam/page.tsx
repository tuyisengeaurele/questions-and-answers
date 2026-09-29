"use client";

import { useEffect, useRef, useState } from "react";
import { ActionBar, ActionBarSpacer } from "@/components/action-bar";
import { useConfirm } from "@/components/confirm-dialog";
import { useCountdown } from "@/components/countdown";
import { useT } from "@/components/lang-provider";
import { useLeaveGuard } from "@/components/leave-guard";
import { useProgress } from "@/components/progress-provider";
import { QuestionCard } from "@/components/question-card";
import { RecentExams } from "@/components/recent-exams";
import { ResumeCard } from "@/components/resume-card";
import { Round } from "@/components/round";
import { useKeys } from "@/components/use-keys";
import { useSwipe } from "@/components/use-swipe";
import { EXAM_MIN_IMAGES, EXAM_PASS, EXAM_SECONDS, EXAM_SIZE } from "@/lib/constants";
import { formatClock } from "@/lib/format";
import { optionIndexForKey } from "@/lib/keys";
import { byId, questions } from "@/lib/questions";
import { scoreExam } from "@/lib/scoring";
import { pickSet } from "@/lib/selector";
import { clearResume, loadExam, saveResume, type ExamSave } from "@/lib/session";
import { getStorage } from "@/lib/storage";
import type { OptionKey, Question } from "@/lib/types";

type Answers = Record<number, OptionKey | undefined>;

interface RunProps {
  set: Question[];
  endsAt: number;
  initial?: { index: number; answers: Answers };
  onFinish: (answers: Answers) => void;
}

function Run({ set, endsAt, initial, onFinish }: RunProps) {
  const { t } = useT();
  const confirm = useConfirm();
  const [i, setI] = useState(initial?.index ?? 0);
  const [answers, setAnswers] = useState<Answers>(initial?.answers ?? {});
  const answersRef = useRef<Answers>(initial?.answers ?? {});
  const finished = useRef(false);

  useLeaveGuard(true, { title: t("leave.title"), message: t("leave.message") });

  function submit() {
    if (finished.current) return;
    finished.current = true;
    onFinish(answersRef.current);
  }

  const left = useCountdown(endsAt, submit);
  const q = set[i];
  const unanswered = set.filter((x) => !answers[x.id]).length;
  const last = i === set.length - 1;

  function remember(index: number, next: Answers) {
    saveResume(getStorage(), "exam", {
      ids: set.map((x) => x.id),
      index,
      answers: next as Record<number, OptionKey>,
      endsAt,
      savedAt: Date.now(),
    });
  }

  function go(index: number) {
    if (index < 0 || index >= set.length) return;
    setI(index);
    remember(index, answersRef.current);
  }

  function pick(key: OptionKey) {
    answersRef.current = { ...answersRef.current, [q.id]: key };
    setAnswers(answersRef.current);
    remember(i, answersRef.current);
  }

  async function ask() {
    if (unanswered === 0) return submit();
    const ok = await confirm({
      title: t("submit.title"),
      message: unanswered === 1 ? t("submit.message_one", { n: unanswered }) : t("submit.message_other", { n: unanswered }),
      confirmLabel: t("submit.confirm"),
      cancelLabel: t("submit.keep"),
    });
    if (ok) submit();
  }

  useKeys((e) => {
    const index = optionIndexForKey(e.key, q.options.length);
    if (index !== null) {
      e.preventDefault();
      pick(q.options[index].key);
    } else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
  });

  const swipe = useSwipe(
    () => go(i + 1),
    () => go(i - 1),
  );

  return (
    <section>
      <header className="sticky top-0 z-10 -mx-4 mb-4 bg-bg px-4 pb-2 pt-2 md:top-16">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="tabular text-sm text-mute">{t("exam.qOf", { i: i + 1, n: set.length })}</span>
          <span className={`tabular text-lg font-semibold transition-colors ${left <= 60 ? "text-bad" : ""}`}>{formatClock(left)}</span>
          <button onClick={ask} className="press min-h-12 rounded-xl px-3 text-sm font-medium text-accent">
            {t("exam.submit")}
          </button>
        </div>
        <ol className="flex gap-1.5 overflow-x-auto pb-1" aria-label={t("exam.questions")}>
          {set.map((x, n) => (
            <li key={x.id}>
              <button
                onClick={() => go(n)}
                aria-label={answers[x.id] ? t("exam.chipAnswered", { i: n + 1 }) : t("exam.chip", { i: n + 1 })}
                aria-current={n === i}
                className={`press tabular size-12 shrink-0 rounded-lg text-sm font-medium ${
                  n === i ? "bg-lime text-on-lime" : answers[x.id] ? "bg-panel2 text-text" : "border border-line text-mute"
                }`}
              >
                {n + 1}
              </button>
            </li>
          ))}
        </ol>
      </header>
      <div {...swipe} className="touch-pan-y">
        <QuestionCard key={q.id} question={q} picked={answers[q.id]} reveal={false} onPick={pick} focusOnMount={i > 0} />
      </div>
      <ActionBarSpacer />
      <ActionBar>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => go(i - 1)}
            disabled={i === 0}
            className="press min-h-14 rounded-2xl border border-line font-medium disabled:opacity-40"
          >
            {t("exam.prev")}
          </button>
          {last ? (
            <button onClick={ask} className="press min-h-14 rounded-2xl bg-lime font-semibold text-on-lime">
              {unanswered > 0 ? t("exam.submitLeft", { n: unanswered }) : t("exam.submit")}
            </button>
          ) : (
            <button onClick={() => go(i + 1)} className="press min-h-14 rounded-2xl border border-line font-medium">
              {t("exam.next")}
            </button>
          )}
        </div>
      </ActionBar>
    </section>
  );
}

function Result({
  set,
  answers,
  onAgain,
  onRetry,
}: {
  set: Question[];
  answers: Answers;
  onAgain: () => void;
  onRetry: (missed: Question[]) => void;
}) {
  const { t } = useT();
  const [wrongOnly, setWrongOnly] = useState(true);
  const { correct, total, passed } = scoreExam(set, answers);
  const missed = set.filter((q) => answers[q.id] !== q.answer);
  const shown = wrongOnly ? missed : set;

  return (
    <section className="space-y-6">
      <div className="rise space-y-2 pt-2 text-center">
        <p className={`text-sm font-semibold uppercase tracking-wide ${passed ? "text-accent" : "text-bad"}`}>
          {passed ? t("exam.passed") : t("exam.failed")}
        </p>
        <p className="tabular text-6xl font-semibold">
          {correct}
          <span className="text-mute">/{total}</span>
        </p>
        <p className="text-mute">{t("exam.needToPass", { n: Math.min(EXAM_PASS, total) })}</p>
      </div>
      <div className="grid gap-3">
        {missed.length > 0 && (
          <button onClick={() => onRetry(missed)} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
            {t("round.retry")}
          </button>
        )}
        <button
          onClick={onAgain}
          className={`press min-h-14 w-full rounded-2xl font-semibold ${missed.length > 0 ? "border border-line" : "bg-lime text-on-lime"}`}
        >
          {t("exam.again")}
        </button>
      </div>
      <div>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-panel p-1">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setWrongOnly(v)}
              aria-pressed={wrongOnly === v}
              className={`press min-h-12 rounded-xl text-sm font-medium ${wrongOnly === v ? "bg-lime text-on-lime" : "text-mute"}`}
            >
              {v ? t("exam.missed", { n: total - correct }) : t("exam.all", { n: total })}
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="text-mute">{t("exam.clean")}</p>}
        <ol className="space-y-8">
          {shown.map((q) => (
            <li key={q.id} className="rise">
              <p className="mb-2 text-sm text-mute">
                {t("exam.qLabel", { i: set.indexOf(q) + 1 })}
                {answers[q.id] ? "" : ` · ${t("exam.notAnswered")}`}
              </p>
              <QuestionCard question={q} picked={answers[q.id]} reveal disabled />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

type State =
  | { phase: "idle" }
  | { phase: "run"; set: Question[]; endsAt: number; initial?: ExamSave }
  | { phase: "done"; set: Question[]; answers: Answers }
  | { phase: "retry"; set: Question[]; answers: Answers; missed: Question[] };

export default function ExamPage() {
  const { t } = useT();
  const { progress, dispatch } = useProgress();
  const [state, setState] = useState<State>({ phase: "idle" });
  const [saved, setSaved] = useState<ExamSave | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    // Read after mount: a saved exam lives in this browser only.
    const time = Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setSaved(loadExam(getStorage(), time, (id) => byId.has(id)));
    setNow(time);
  }, []);

  function start() {
    clearResume(getStorage(), "exam");
    setSaved(null);
    setState({ phase: "run", set: pickSet(questions, EXAM_SIZE, EXAM_MIN_IMAGES), endsAt: Date.now() + EXAM_SECONDS * 1000 });
  }

  function resume(s: ExamSave) {
    setState({ phase: "run", set: s.ids.map((id) => byId.get(id)!), endsAt: s.endsAt, initial: s });
    setSaved(null);
  }

  function finish(set: Question[], answers: Answers) {
    clearResume(getStorage(), "exam");
    const result = scoreExam(set, answers);
    dispatch({ type: "exam", result: { at: Date.now(), ...result } });
    for (const q of set) {
      if (answers[q.id]) dispatch({ type: "answer", id: q.id, correct: answers[q.id] === q.answer });
    }
    setState({ phase: "done", set, answers });
  }

  if (state.phase === "run") {
    const { set, endsAt, initial } = state;
    return <Run set={set} endsAt={endsAt} initial={initial} onFinish={(a) => finish(set, a)} />;
  }
  if (state.phase === "retry") {
    const { set, answers } = state;
    return <Round questions={state.missed} persist={false} onExit={() => setState({ phase: "done", set, answers })} />;
  }
  if (state.phase === "done") {
    const { set, answers } = state;
    return (
      <Result
        set={set}
        answers={answers}
        onAgain={start}
        onRetry={(missed) => setState({ phase: "retry", set, answers, missed })}
      />
    );
  }

  const answered = saved ? Object.keys(saved.answers).length : 0;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("exam.title")}</h1>
      {saved && (
        <ResumeCard
          title={t("resume.examTitle")}
          detail={t("resume.examSub", { time: formatClock((saved.endsAt - now) / 1000), done: answered, n: saved.ids.length })}
          onResume={() => resume(saved)}
          onDiscard={() => {
            clearResume(getStorage(), "exam");
            setSaved(null);
          }}
        />
      )}
      <ul className="space-y-2 rounded-2xl border border-line bg-panel p-5 text-mute">
        <li>{t("exam.ruleQuestions", { n: EXAM_SIZE })}</li>
        <li>{t("exam.ruleTime", { n: EXAM_SECONDS / 60 })}</li>
        <li>{t("exam.rulePass", { n: EXAM_PASS })}</li>
        <li>{t("exam.ruleHidden")}</li>
      </ul>
      <button onClick={start} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
        {t("exam.start")}
      </button>
      <RecentExams exams={progress.exams} now={now} />
    </section>
  );
}
