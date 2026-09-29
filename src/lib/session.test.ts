import { describe, expect, it } from "vitest";
import { clearResume, loadExam, loadExpiredExam, loadRound, saveResume, MAX_AGE_MS } from "./session";

function memory() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const known = (id: number) => id < 100;
const now = 1_000_000_000_000;

describe("resume state", () => {
  it("round-trips a round", () => {
    const s = memory();
    saveResume(s, "round", { ids: [1, 2, 3], index: 1, picks: { 1: "a", 2: "c" }, savedAt: now });
    expect(loadRound(s, now + 1000, known)).toEqual({ ids: [1, 2, 3], index: 1, picks: { 1: "a", 2: "c" }, savedAt: now });
  });

  it("round-trips an exam that is still running", () => {
    const s = memory();
    const save = { ids: [4, 5], index: 0, answers: { 4: "b" as const }, endsAt: now + 60_000, savedAt: now };
    saveResume(s, "exam", save);
    expect(loadExam(s, now + 1000, known)).toEqual(save);
  });

  it("drops saves that are too old, whose exam time is over, or that mention unknown questions", () => {
    const s = memory();
    saveResume(s, "round", { ids: [1], index: 0, picks: {}, savedAt: now });
    expect(loadRound(s, now + MAX_AGE_MS + 1, known)).toBeNull();

    saveResume(s, "exam", { ids: [1], index: 0, answers: {}, endsAt: now + 1000, savedAt: now });
    expect(loadExam(s, now + 2000, known)).toBeNull();

    saveResume(s, "round", { ids: [1, 500], index: 0, picks: {}, savedAt: now });
    expect(loadRound(s, now, known)).toBeNull();
  });

  it("drops saves with an impossible shape", () => {
    const s = memory();
    s.setItem("ikizamini:resume:round", "{nope");
    expect(loadRound(s, now, known)).toBeNull();
    s.setItem("ikizamini:resume:round", JSON.stringify({ ids: [1, 2], index: 5, picks: {}, savedAt: now }));
    expect(loadRound(s, now, known)).toBeNull();
    s.setItem("ikizamini:resume:round", JSON.stringify({ ids: [1, 2], index: 0, picks: { 1: "z" }, savedAt: now }));
    expect(loadRound(s, now, known)).toBeNull();
    s.setItem("ikizamini:resume:round", JSON.stringify({ ids: [], index: 0, picks: {}, savedAt: now }));
    expect(loadRound(s, now, known)).toBeNull();
  });

  it("clears a save, and never throws when storage is missing or blocked", () => {
    const s = memory();
    saveResume(s, "round", { ids: [1], index: 0, picks: {}, savedAt: now });
    clearResume(s, "round");
    expect(loadRound(s, now, known)).toBeNull();

    const blocked = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(() => saveResume(blocked, "round", { ids: [1], index: 0, picks: {}, savedAt: now })).not.toThrow();
    expect(loadRound(blocked, now, known)).toBeNull();
    expect(() => clearResume(blocked, "round")).not.toThrow();
    expect(loadRound(null, now, known)).toBeNull();
    expect(() => saveResume(null, "exam", { ids: [1], index: 0, answers: {}, endsAt: now + 1, savedAt: now })).not.toThrow();
  });

  it("hands back an exam whose time ran out while the app was closed, so it can be scored", () => {
    const s = memory();
    const save = { ids: [1, 2], index: 1, answers: { 1: "a" as const }, endsAt: now + 1000, savedAt: now };
    saveResume(s, "exam", save);
    expect(loadExpiredExam(s, now + 500, known)).toBeNull();
    expect(loadExpiredExam(s, now + 2000, known)).toEqual(save);
    expect(loadExpiredExam(s, now + MAX_AGE_MS + 5000, known)).toBeNull();
    expect(loadExpiredExam(null, now, known)).toBeNull();
  });
});
