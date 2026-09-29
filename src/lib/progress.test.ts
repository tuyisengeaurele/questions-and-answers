import { describe, expect, it } from "vitest";
import { initialProgress, mistakeIds, reducer, seenIds, type ExamResult } from "./progress";
import { loadProgress, saveProgress } from "./storage";
import { summarize } from "./stats";

const answer = (id: number, correct: boolean) => ({ type: "answer", id, correct }) as const;

describe("reducer", () => {
  it("records a right answer", () => {
    const s = reducer(initialProgress(), answer(5, true));
    expect(s.stats[5]).toEqual({ seen: 1, correct: 1, wrong: 0, last: "right" });
    expect([...seenIds(s)]).toEqual([5]);
  });

  it("tracks wrong answers and lists them as mistakes", () => {
    const s = reducer(initialProgress(), answer(4, false));
    expect(s.stats[4]).toEqual({ seen: 1, correct: 0, wrong: 1, last: "wrong" });
    expect(mistakeIds(s)).toEqual([4]);
  });

  it("clears a mistake once the question is answered right", () => {
    let s = reducer(initialProgress(), answer(7, false));
    s = reducer(s, answer(7, true));
    expect(mistakeIds(s)).toEqual([]);
    expect(s.stats[7]).toMatchObject({ seen: 2, correct: 1, wrong: 1 });
  });

  it("keeps the last 10 exams, newest first", () => {
    let s = initialProgress();
    for (let i = 0; i < 12; i++) {
      const result: ExamResult = { at: i, correct: i, total: 20, passed: i >= 12 };
      s = reducer(s, { type: "exam", result });
    }
    expect(s.exams).toHaveLength(10);
    expect(s.exams[0].at).toBe(11);
  });

  it("stores the practice cycle and resets everything", () => {
    let s = reducer(initialProgress(), { type: "cycle", ids: [1, 2] });
    expect(s.cycle).toEqual([1, 2]);
    s = reducer(reducer(s, answer(1, true)), { type: "reset" });
    expect(s).toEqual(initialProgress());
  });
});

describe("storage", () => {
  const fake = (value: string | null) => ({ getItem: () => value });

  it("round-trips progress", () => {
    let saved = "";
    const p = reducer(initialProgress(), answer(1, true));
    expect(saveProgress({ setItem: (_k, v) => void (saved = v) }, p)).toBe(true);
    expect(loadProgress(fake(saved))).toEqual(p);
  });

  it("falls back to fresh progress for null storage, corrupt JSON, or another version", () => {
    expect(loadProgress(null)).toEqual(initialProgress());
    expect(loadProgress(fake("{nope"))).toEqual(initialProgress());
    expect(loadProgress(fake(JSON.stringify({ v: 99, stats: {} })))).toEqual(initialProgress());
    expect(loadProgress(fake(JSON.stringify({ v: 1, stats: "bad" })))).toEqual(initialProgress());
  });

  it("fills in missing fields from older saves", () => {
    const p = loadProgress(fake(JSON.stringify({ v: 1, stats: { 3: { seen: 1, correct: 1, wrong: 0, last: "right" } } })));
    expect(p.exams).toEqual([]);
    expect(p.cycle).toEqual([]);
    expect(p.stats[3].seen).toBe(1);
  });

  it("drops wrongly typed fields instead of crashing later", () => {
    const bad = JSON.stringify({
      v: 1,
      stats: { 1: null, 2: { seen: 1, correct: 1, wrong: 0, last: "right" }, 3: { seen: "x" } },
      exams: null,
      cycle: "nope",
    });
    const p = loadProgress(fake(bad));
    expect(Object.keys(p.stats)).toEqual(["2"]);
    expect(p.exams).toEqual([]);
    expect(p.cycle).toEqual([]);
    expect(summarize(p, 100).seen).toBe(1);
  });

  it("reports failure instead of throwing when saving is blocked", () => {
    const throwing = { setItem: () => { throw new Error("quota"); } };
    expect(saveProgress(throwing, initialProgress())).toBe(false);
    expect(saveProgress(null, initialProgress())).toBe(false);
  });
});

describe("summarize", () => {
  it("computes the home screen numbers", () => {
    let s = initialProgress();
    s = reducer(s, answer(1, true));
    s = reducer(s, answer(2, false));
    s = reducer(s, answer(2, false));
    s = reducer(s, { type: "exam", result: { at: 1, correct: 15, total: 20, passed: true } });
    expect(summarize(s, 100)).toEqual({ answered: 3, seen: 2, accuracy: 33, mistakes: 1, unseen: 98, examsPassed: 1 });
    expect(summarize(initialProgress(), 100).accuracy).toBe(0);
  });
});
