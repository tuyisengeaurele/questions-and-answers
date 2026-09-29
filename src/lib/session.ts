import type { OptionKey } from "./types";

/** Saves older than this are ignored. */
export const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface RoundSave {
  ids: number[];
  index: number;
  picks: Record<number, OptionKey>;
  savedAt: number;
}

export interface ExamSave {
  ids: number[];
  index: number;
  answers: Record<number, OptionKey>;
  endsAt: number;
  savedAt: number;
}

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const keyFor = (kind: "round" | "exam") => `ikizamini:resume:${kind}`;
const isKey = (v: unknown): v is OptionKey => v === "a" || v === "b" || v === "c" || v === "d";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function saveResume(store: Store | null, kind: "round", data: RoundSave): void;
export function saveResume(store: Store | null, kind: "exam", data: ExamSave): void;
export function saveResume(store: Store | null, kind: "round" | "exam", data: RoundSave | ExamSave): void {
  try {
    store?.setItem(keyFor(kind), JSON.stringify(data));
  } catch {
    // Storage is blocked: resuming simply will not be offered.
  }
}

export function clearResume(store: Store | null, kind: "round" | "exam"): void {
  try {
    store?.removeItem(keyFor(kind));
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

function read(store: Store | null, kind: "round" | "exam"): Record<string, unknown> | null {
  try {
    const raw = store?.getItem(keyFor(kind));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function validAnswers(map: unknown, ids: number[]): map is Record<number, OptionKey> {
  if (!map || typeof map !== "object") return false;
  return Object.entries(map).every(([id, key]) => ids.includes(Number(id)) && isKey(key));
}

function validCommon(s: Record<string, unknown>, now: number, known: (id: number) => boolean): s is Record<string, unknown> & { ids: number[]; index: number; savedAt: number } {
  const { ids, index, savedAt } = s;
  return (
    Array.isArray(ids) && ids.length > 0 && ids.every((id) => isNum(id) && known(id)) &&
    isNum(index) && index >= 0 && index < ids.length &&
    isNum(savedAt) && now - savedAt <= MAX_AGE_MS
  );
}

export function loadRound(store: Store | null, now: number, known: (id: number) => boolean): RoundSave | null {
  const s = read(store, "round");
  if (!s || !validCommon(s, now, known) || !validAnswers(s.picks, s.ids)) return null;
  return { ids: s.ids, index: s.index, picks: s.picks, savedAt: s.savedAt };
}

export function loadExam(store: Store | null, now: number, known: (id: number) => boolean): ExamSave | null {
  const s = read(store, "exam");
  if (!s || !validCommon(s, now, known) || !validAnswers(s.answers, s.ids)) return null;
  if (!isNum(s.endsAt) || s.endsAt <= now) return null;
  return { ids: s.ids, index: s.index, answers: s.answers, endsAt: s.endsAt, savedAt: s.savedAt };
}
