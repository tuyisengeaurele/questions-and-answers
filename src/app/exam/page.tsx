"use client";

import { useRef, useState } from "react";
import { useCountdown } from "@/components/countdown";
import { useProgress } from "@/components/progress-provider";
import { QuestionCard } from "@/components/question-card";
import { EXAM_MIN_IMAGES, EXAM_PASS, EXAM_SECONDS, EXAM_SIZE } from "@/lib/constants";
import { formatClock } from "@/lib/format";
import { questions } from "@/lib/questions";
import { scoreExam } from "@/lib/scoring";
import { pickSet } from "@/lib/selector";
import type { OptionKey, Question } from "@/lib/types";

type Answers = Record<number, OptionKey | undefined>;

function Run({ set, onFinish }: { set: Question[]; onFinish: (answers: Answers) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const answersRef = useRef<Answers>({});
  const finished = useRef(false);

  function submit() {
    if (finished.current) return;
    finished.current = true;
    onFinish(answersRef.current);
  }

  const left = useCountdown(EXAM_SECONDS, submit);
  const q = set[i];
  const unanswered = set.filter((x) => !answers[x.id]).length;

  function pick(key: OptionKey) {
    answersRef.current = { ...answersRef.current, [q.id]: key };
    setAnswers(answersRef.current);
  }

  return (
    <section>
      <header className="mb-4 flex items-center justify-between">
        <span className="tabular text-sm text-mute">
          Question {i + 1} of {set.length}
        </span>
        <span className={`tabular text-lg font-semibold transition-colors ${left <= 60 ? "text-bad" : ""}`}>
          {formatClock(left)}
        </span>
      </header>
      <ol className="mb-5 flex gap-1.5 overflow-x-auto pb-2" aria-label="Questions">
        {set.map((x, n) => (
          <li key={x.id}>
            <button
              onClick={() => setI(n)}
              aria-label={`Question ${n + 1}${answers[x.id] ? ", answered" : ""}`}
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
      <QuestionCard key={q.id} question={q} picked={answers[q.id]} reveal={false} onPick={pick} />
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setI(i - 1)}
          disabled={i === 0}
          className="press min-h-14 rounded-2xl border border-line font-medium disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => setI(i + 1)}
          disabled={i === set.length - 1}
          className="press min-h-14 rounded-2xl border border-line font-medium disabled:opacity-40"
        >
          Next
        </button>
      </div>
      <button
        onClick={() => {
          if (unanswered === 0 || confirm(`${unanswered} unanswered. Submit anyway?`)) submit();
        }}
        className="press mt-3 min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime"
      >
        Submit{unanswered > 0 ? ` (${unanswered} unanswered)` : ""}
      </button>
    </section>
  );
}

function Result({ set, answers, onAgain }: { set: Question[]; answers: Answers; onAgain: () => void }) {
  const [wrongOnly, setWrongOnly] = useState(true);
  const { correct, total, passed } = scoreExam(set, answers);
  const shown = set.filter((q) => !wrongOnly || answers[q.id] !== q.answer);

  return (
    <section className="space-y-6">
      <div className="rise space-y-2 pt-2 text-center">
        <p className={`text-sm font-semibold uppercase tracking-wide ${passed ? "text-accent" : "text-bad"}`}>
          {passed ? "Passed" : "Not passed"}
        </p>
        <p className="tabular text-6xl font-semibold">
          {correct}
          <span className="text-mute">/{total}</span>
        </p>
        <p className="text-mute">You need {Math.min(EXAM_PASS, total)} to pass.</p>
      </div>
      <button onClick={onAgain} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
        Take another exam
      </button>
      <div>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-panel p-1">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              onClick={() => setWrongOnly(v)}
              aria-pressed={wrongOnly === v}
              className={`press min-h-12 rounded-xl text-sm font-medium ${wrongOnly === v ? "bg-lime text-on-lime" : "text-mute"}`}
            >
              {v ? `Missed (${total - correct})` : `All (${total})`}
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="text-mute">Nothing missed. Clean sheet.</p>}
        <ol className="space-y-8">
          {shown.map((q) => (
            <li key={q.id} className="rise">
              <p className="mb-2 text-sm text-mute">
                Question {set.indexOf(q) + 1}
                {answers[q.id] ? "" : " · not answered"}
              </p>
              <QuestionCard question={q} picked={answers[q.id]} reveal disabled />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default function ExamPage() {
  const { dispatch } = useProgress();
  const [state, setState] = useState<
    { phase: "idle" } | { phase: "run"; set: Question[] } | { phase: "done"; set: Question[]; answers: Answers }
  >({ phase: "idle" });

  function start() {
    setState({ phase: "run", set: pickSet(questions, EXAM_SIZE, EXAM_MIN_IMAGES) });
  }

  function finish(set: Question[], answers: Answers) {
    const result = scoreExam(set, answers);
    dispatch({ type: "exam", result: { at: Date.now(), ...result } });
    for (const q of set) {
      if (answers[q.id]) dispatch({ type: "answer", id: q.id, correct: answers[q.id] === q.answer });
    }
    setState({ phase: "done", set, answers });
  }

  if (state.phase === "run") {
    const { set } = state;
    return <Run set={set} onFinish={(a) => finish(set, a)} />;
  }
  if (state.phase === "done") return <Result set={state.set} answers={state.answers} onAgain={start} />;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mock exam</h1>
      <ul className="space-y-2 rounded-2xl border border-line bg-panel p-5 text-mute">
        <li>
          <span className="tabular text-text">{EXAM_SIZE}</span> random questions, including road sign questions
        </li>
        <li>
          <span className="tabular text-text">{EXAM_SECONDS / 60}</span> minutes on the clock
        </li>
        <li>
          <span className="tabular text-text">{EXAM_PASS}</span> correct to pass
        </li>
        <li>No answers shown until you submit</li>
      </ul>
      <button onClick={start} className="press min-h-14 w-full rounded-2xl bg-lime font-semibold text-on-lime">
        Start exam
      </button>
    </section>
  );
}
