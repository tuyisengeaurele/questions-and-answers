import { describe, expect, it } from "vitest";
import { pickRound, pickSet } from "./selector";
import { shuffle } from "./shuffle";
import { hasImage } from "./questions";
import type { Question } from "./types";

function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function make(id: number, image = false): Question {
  return {
    id,
    num: id,
    text: `q${id}`,
    options: [
      { key: "a", text: "A" },
      { key: "b", text: "B" },
      { key: "c", text: "A na B" },
      { key: "d", text: "D" },
    ],
    answer: "c",
    ...(image ? { image: { src: `/q/${id}.webp`, w: 10, h: 10 } } : {}),
  };
}

const pool = (text: number, images: number) => [
  ...Array.from({ length: text }, (_, i) => make(i + 1)),
  ...Array.from({ length: images }, (_, i) => make(1000 + i, true)),
];

describe("shuffle", () => {
  it("returns a permutation and leaves the input alone", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, seeded(1));
    expect([...out].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("pickSet", () => {
  it("returns the requested size, unique, with at least the minimum images", () => {
    for (let s = 1; s <= 25; s++) {
      const set = pickSet(pool(40, 12), 20, 4, seeded(s));
      expect(set).toHaveLength(20);
      expect(new Set(set.map((q) => q.id)).size).toBe(20);
      expect(set.filter(hasImage).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("does not put all image questions at the start", () => {
    const starts = new Set<boolean>();
    for (let s = 1; s <= 25; s++) starts.add(hasImage(pickSet(pool(40, 12), 20, 4, seeded(s))[0]));
    expect(starts.size).toBe(2);
  });

  it("clamps when fewer image questions exist than the minimum", () => {
    const set = pickSet(pool(40, 2), 20, 4, seeded(3));
    expect(set).toHaveLength(20);
    expect(set.filter(hasImage)).toHaveLength(2);
  });

  it("returns the whole pool when it is smaller than the size, and [] for an empty pool", () => {
    expect(pickSet(pool(3, 1), 20, 4, seeded(1))).toHaveLength(4);
    expect(pickSet([], 20, 4)).toEqual([]);
  });

  it("never touches option order", () => {
    const set = pickSet(pool(40, 12), 20, 4, seeded(9));
    for (const q of set) {
      expect(q.options.map((o) => o.key)).toEqual(["a", "b", "c", "d"]);
      expect(q.options[2].text).toBe("A na B");
    }
  });
});

describe("pickRound", () => {
  /** Play a round the way the app does: each question answered is added to the used list. */
  const play = (r: { round: Question[]; used: number[] }) => [...r.used, ...r.round.map((q) => q.id)];

  it("walks the whole pool before repeating", () => {
    const p = pool(20, 5); // 25 questions
    const r1 = pickRound(p, [], 10, 2, seeded(1));
    const r2 = pickRound(p, play(r1), 10, 2, seeded(2));
    const ids = [...r1.round, ...r2.round].map((q) => q.id);
    expect(new Set(ids).size).toBe(20);
    expect(r1.round.filter(hasImage).length).toBeGreaterThanOrEqual(2);
    expect(r2.round.filter(hasImage).length).toBeGreaterThanOrEqual(2);
  });

  it("does not use up questions that were picked but never answered", () => {
    const p = pool(20, 5);
    const r1 = pickRound(p, [], 10, 2, seeded(1));
    expect(r1.used).toEqual([]);
    const again = pickRound(p, r1.used, 10, 2, seeded(1));
    expect(again.round.map((q) => q.id)).toEqual(r1.round.map((q) => q.id));
  });

  it("finishes the leftovers first, then starts a new pass with an empty used list", () => {
    const p = pool(20, 5);
    const r1 = pickRound(p, [], 10, 2, seeded(1));
    const used2 = play(r1);
    const r2 = pickRound(p, used2, 10, 2, seeded(2));
    const used3 = play(r2);
    const leftovers = p.filter((q) => !used3.includes(q.id)).map((q) => q.id);
    expect(leftovers).toHaveLength(5);
    const r3 = pickRound(p, used3, 10, 2, seeded(3));
    const r3ids = r3.round.map((q) => q.id);
    expect(r3ids).toHaveLength(10);
    expect(new Set(r3ids).size).toBe(10);
    for (const id of leftovers) expect(r3ids).toContain(id);
    expect(r3.used).toEqual([]);
  });

  it("copes with an empty pool", () => {
    expect(pickRound([], [1, 2], 10, 2)).toEqual({ round: [], used: [1, 2] });
  });

  it("keeps image questions in every round of a full pass, including the last ones", () => {
    for (let s = 1; s <= 10; s++) {
      const rand = seeded(s);
      const p = pool(70, 30); // 100 questions, 10 rounds
      let used: number[] = [];
      for (let r = 0; r < 10; r++) {
        const next = pickRound(p, used, 10, 2, rand);
        expect(next.round.filter(hasImage).length, `seed ${s} round ${r + 1}`).toBeGreaterThanOrEqual(2);
        used = play(next);
      }
    }
  });
});
