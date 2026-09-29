"use client";

import { useState } from "react";
import type { OptionKey, Pic, Question } from "@/lib/types";

interface Props {
  question: Question;
  picked?: OptionKey;
  /** Show right/wrong colours. */
  reveal: boolean;
  disabled?: boolean;
  onPick?: (key: OptionKey) => void;
}

function Picture({ pic, className }: { pic: Pic; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-optimised WebP with explicit size
    <img
      src={pic.src}
      width={pic.w}
      height={pic.h}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
      className={className}
    />
  );
}

function Mark({ kind }: { kind: "right" | "wrong" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mark-in size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {kind === "right" ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M4 4l8 8M12 4l-8 8" />}
    </svg>
  );
}

export function QuestionCard({ question, picked, reveal, disabled, onPick }: Props) {
  return (
    <div className="slide-in">
      {question.text && <h2 className="text-lg font-semibold leading-snug">{question.text}</h2>}
      {question.image && (
        <div className="mt-4 flex justify-center rounded-2xl bg-white p-3">
          <Picture pic={question.image} className="h-auto max-h-56 w-auto max-w-full" />
        </div>
      )}
      <ul className="mt-5 space-y-2.5">
        {question.options.map((o, i) => {
          const isAnswer = reveal && o.key === question.answer;
          const isWrongPick = reveal && o.key === picked && o.key !== question.answer;
          const isSelected = !reveal && o.key === picked;
          const style = isAnswer
            ? "border-lime bg-lime/15"
            : isWrongPick
              ? "border-bad bg-bad/15"
              : isSelected
                ? "border-lime bg-panel2"
                : reveal
                  ? "border-line bg-panel opacity-55"
                  : "border-line bg-panel hover:border-mute/50";
          const badge =
            isAnswer || isSelected
              ? "bg-lime text-on-lime"
              : isWrongPick
                ? "bg-bad text-on-lime"
                : "bg-panel2 text-mute";
          return (
            <li key={o.key} className="enter" style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick?.(o.key)}
                aria-pressed={o.key === picked}
                className={`press flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left ${style}`}
              >
                <span
                  className={`press mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold uppercase ${badge}`}
                >
                  {isAnswer ? <Mark kind="right" /> : isWrongPick ? <Mark kind="wrong" /> : o.key}
                </span>
                <span className="min-w-0 flex-1">
                  {o.text && <span className="block leading-snug">{o.text}</span>}
                  {o.image && (
                    <span className="mt-1 block rounded-lg bg-white p-2">
                      <Picture pic={o.image} className="mx-auto h-auto max-h-32 w-auto max-w-full" />
                    </span>
                  )}
                </span>
                {isAnswer && <span className="sr-only">Correct answer</span>}
                {isWrongPick && <span className="sr-only">Your answer, incorrect</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
