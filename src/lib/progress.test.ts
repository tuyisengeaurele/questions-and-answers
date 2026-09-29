import { describe, expect, it } from "vitest";
import { initialProgress, mistakeIds, reducer, seenIds, type ExamResult } from "./progress";
import { loadProgress, saveProgress } from "./storage";
import { summarize } from "./stats";

const answer = (id: number, correct: boolean) => ({ type: "answer", id, correct }) as const;

describe("reducer", () => {
  it("records a right answer", () => {
    const s = reducer(initialProgress(), answer(5, true));
    expect(s.stats[5]).toEqual({ seen: 1, correct: 1, wrong: 0, last: "right", run: 1 });
    expect([...seenIds(s)]).toEqual([5]);
  });

  it("tracks wrong answers and lists them as mistakes", () => {
    const s = reducer(initialProgress(), answer(4, false));
    expect(s.stats[4]).toEqual({ seen: 1, correct: 0, wrong: 1, last: "wrong", run: 0 });
    expect(mistakeIds(s)).toEqual([4]);
  });

  it("keeps a mistake until it has been answered right twice in a row", () => {
    let s = reducer(initialProgress(), answer(7, false));
    s = reducer(s, answer(7, true));
    expect(mistakeIds(s)).toEqual([7]);
    s = reducer(s, answer(7, false));
    s = reducer(s, answer(7, true));
    expect(mistakeIds(s)).toEqual([7]);
    s = reducer(s, answer(7, true));
    expect(mistakeIds(s)).toEqual([]);
    expect(s.stats[7]).toMatchObject({ seen: 5, correct: 3, wrong: 2, run: 2 });
  });

  it("never lists a question that was always answered right", () => {
    const s = reducer(initialProgress(), answer(9, true));
    expect(mistakeIds(s)).toEqual([]);
  });

  it("treats older saves without a run count as already cleared when the last answer was right", () => {
    const old = { ...initialProgress(), stats: { 3: { seen: 2, correct: 1, wrong: 1, last: "right" as const }, 4: { seen: 1, correct: 0, wrong: 1, last: "wrong" as const } } };
    expect(mistakeIds(old)).toEqual([4]);
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

  it("does not rewrite storage when nothing changed, so tabs cannot ping-pong", () => {
    let writes = 0;
    let stored = "";
    const store = { getItem: () => stored || null, setItem: (_k: string, v: string) => { writes++; stored = v; } };
    const p = reducer(initialProgress(), answer(1, true));
    saveProgress(store, p);
    saveProgress(store, p);
    expect(writes).toBe(1);
  });

  it("keeps the run count of a saved question", () => {
    const p = reducer(reducer(initialProgress(), answer(2, false)), answer(2, true));
    let saved = "";
    saveProgress({ setItem: (_k, v) => void (saved = v) }, p);
    expect(loadProgress(fake(saved)).stats[2].run).toBe(1);
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

describe("sync from another tab", () => {
  it("adopts different progress and keeps the same object for identical progress", () => {
    const mine = reducer(initialProgress(), answer(1, true));
    const theirs = reducer(mine, answer(2, false));
    expect(reducer(mine, { type: "sync", state: theirs })).toBe(theirs);
    expect(reducer(mine, { type: "sync", state: JSON.parse(JSON.stringify(mine)) })).toBe(mine);
  });
});
