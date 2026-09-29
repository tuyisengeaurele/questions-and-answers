import { mistakeIds, type Progress } from "./progress";

export function summarize(p: Progress, totalQuestions: number) {
  const entries = Object.values(p.stats);
  const answered = entries.reduce((n, s) => n + s.seen, 0);
  const correct = entries.reduce((n, s) => n + s.correct, 0);
  return {
    answered,
    seen: entries.length,
    accuracy: answered ? Math.round((100 * correct) / answered) : 0,
    mistakes: mistakeIds(p).length,
    unseen: Math.max(0, totalQuestions - entries.length),
    examsPassed: p.exams.filter((e) => e.passed).length,
  };
}
