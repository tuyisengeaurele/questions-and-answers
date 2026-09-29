export interface QStat {
  seen: number;
  correct: number;
  wrong: number;
  last: "right" | "wrong";
  /** Right answers in a row since the last wrong one. Missing in older saves. */
  run?: number;
}

export interface ExamResult {
  at: number;
  correct: number;
  total: number;
  passed: boolean;
}

export interface Progress {
  v: 1;
  stats: Record<number, QStat>;
  exams: ExamResult[];
  cycle: number[];
}

export type Action =
  | { type: "load"; state: Progress }
  | { type: "sync"; state: Progress }
  | { type: "answer"; id: number; correct: boolean }
  | { type: "exam"; result: ExamResult }
  | { type: "cycle"; ids: number[] }
  | { type: "reset" };

/** A question that was ever answered wrong stays in Mistakes until it is right this many times in a row. */
export const MISTAKE_CLEAR_RUN = 2;

const runOf = (s: QStat): number => s.run ?? (s.last === "right" ? MISTAKE_CLEAR_RUN : 0);

export const initialProgress = (): Progress => ({ v: 1, stats: {}, exams: [], cycle: [] });

export function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case "load":
      return action.state;
    case "sync":
      // Keep the same object when another tab saved identical data, so nothing re-renders or re-saves.
      return JSON.stringify(action.state) === JSON.stringify(state) ? state : action.state;
    case "answer": {
      const prev = state.stats[action.id] ?? { seen: 0, correct: 0, wrong: 0, last: "right" as const, run: 0 };
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.id]: {
            seen: prev.seen + 1,
            correct: prev.correct + (action.correct ? 1 : 0),
            wrong: prev.wrong + (action.correct ? 0 : 1),
            last: action.correct ? "right" : "wrong",
            run: action.correct ? Math.min(runOf(prev) + 1, 99) : 0,
          },
        },
      };
    }
    case "exam":
      return { ...state, exams: [action.result, ...state.exams].slice(0, 10) };
    case "cycle":
      return { ...state, cycle: action.ids };
    case "reset":
      return initialProgress();
  }
}

export const mistakeIds = (p: Progress): number[] =>
  Object.entries(p.stats)
    .filter(([, s]) => s.wrong > 0 && runOf(s) < MISTAKE_CLEAR_RUN)
    .map(([id]) => Number(id));

export const seenIds = (p: Progress): Set<number> => new Set(Object.keys(p.stats).map(Number));
