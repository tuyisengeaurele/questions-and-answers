import { initialProgress, type ExamResult, type Progress, type QStat } from "./progress";

const KEY = "ikizamini:progress:v1";

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isStat = (s: unknown): s is QStat =>
  typeof s === "object" && s !== null &&
  isNum((s as QStat).seen) && isNum((s as QStat).correct) && isNum((s as QStat).wrong) &&
  ((s as QStat).last === "right" || (s as QStat).last === "wrong");
const isExam = (e: unknown): e is ExamResult =>
  typeof e === "object" && e !== null &&
  isNum((e as ExamResult).at) && isNum((e as ExamResult).correct) && isNum((e as ExamResult).total) &&
  typeof (e as ExamResult).passed === "boolean";

export function getStorage(): Storage | null {
  try {
    const s = window.localStorage;
    s.setItem("_t", "1");
    s.removeItem("_t");
    return s;
  } catch {
    return null;
  }
}

export function loadProgress(storage: Pick<Storage, "getItem"> | null): Progress {
  if (!storage) return initialProgress();
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return initialProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || typeof parsed.stats !== "object" || parsed.stats === null) {
      return initialProgress();
    }
    return {
      v: 1,
      stats: Object.fromEntries(Object.entries(parsed.stats).filter(([, st]) => isStat(st))) as Record<number, QStat>,
      exams: Array.isArray(parsed.exams) ? parsed.exams.filter(isExam).slice(0, 10) : [],
      cycle: Array.isArray(parsed.cycle) ? parsed.cycle.filter(isNum) : [],
    };
  } catch {
    return initialProgress();
  }
}

export function saveProgress(storage: Pick<Storage, "setItem"> | null, p: Progress): boolean {
  if (!storage) return false;
  try {
    storage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
