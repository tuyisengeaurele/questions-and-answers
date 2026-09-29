import { initialProgress, type Progress } from "./progress";

const KEY = "ikizamini:progress:v1";

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
    return { ...initialProgress(), ...parsed };
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
