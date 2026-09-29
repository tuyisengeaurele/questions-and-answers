import { EXAM_PASS } from "./constants";
import type { OptionKey, Question } from "./types";

export function scoreExam(
  questions: readonly Question[],
  answers: Readonly<Record<number, OptionKey | undefined>>,
): { correct: number; total: number; passed: boolean } {
  const total = questions.length;
  const correct = questions.filter((q) => answers[q.id] === q.answer).length;
  return { correct, total, passed: total > 0 && correct >= Math.min(EXAM_PASS, total) };
}
