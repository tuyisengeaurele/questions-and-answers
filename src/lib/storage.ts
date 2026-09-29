import { initialProgress, type ExamResult, type Progress, type QStat } from "./progress";

const KEY = "ikizamini:progress:v1";

const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const isStat = (s: unknown): s is QStat =>
  typeof s === "object" && s !== null &&
  isNum((s as QStat).seen) && isNum((s as QStat).correct) && isNum((s as QStat).wrong) &&
  ((s as QStat).last === "right" || (s as QStat).last === "wrong") &&
  ((s as QStat).run === undefined || isNum((s as QStat).run));
const isExam = (e: unknown): e is ExamResult =>
  typeof e === "object" && e !== null &&
  isNum((e as ExamResult).at) && isNum((e as ExamResult).correct) && isNum((e as ExamResult).total) &&
  typeof (e as ExamResult).passed === "boolean";

// Probing writes a test key and tells other tabs about it, so it is done once per page.
let probed: Storage | null | undefined;

export function getStorage(): Storage | null {
  if (probed !== undefined) return probed;
  try {
    const s = window.localStorage;
    s.setItem("_t", "1");
    s.removeItem("_t");
    probed = s;
  } catch {
    probed = null;
  }
  return probed;
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

export function saveProgress(
  storage: (Pick<Storage, "setItem"> & Partial<Pick<Storage, "getItem">>) | null,
  p: Progress,
): boolean {
  if (!storage) return false;
  try {
    const next = JSON.stringify(p);
    if (storage.getItem?.(KEY) !== next) storage.setItem(KEY, next);
    return true;
  } catch {
    return false;
  }
}
