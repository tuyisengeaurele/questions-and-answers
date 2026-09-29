import { describe, expect, it } from "vitest";
import { formatClock } from "./format";
import { scoreExam } from "./scoring";
import type { Question } from "./types";

const q = (id: number, answer: Question["answer"]): Question => ({
  id,
  num: id,
  text: "t",
  options: [
    { key: "a", text: "a" },
    { key: "b", text: "b" },
  ],
  answer,
});

describe("scoreExam", () => {
  const qs = Array.from({ length: 20 }, (_, i) => q(i + 1, "a"));

  it("passes at 12 and fails at 11", () => {
    const answers = (n: number) => Object.fromEntries(qs.slice(0, n).map((x) => [x.id, "a" as const]));
    expect(scoreExam(qs, answers(12))).toEqual({ correct: 12, total: 20, passed: true });
    expect(scoreExam(qs, answers(11)).passed).toBe(false);
  });

  it("counts unanswered questions as wrong", () => {
    expect(scoreExam(qs, {})).toEqual({ correct: 0, total: 20, passed: false });
  });

  it("does not pass an empty exam", () => {
    expect(scoreExam([], {}).passed).toBe(false);
  });

  it("scales the pass mark down for a tiny pool", () => {
    const small = [q(1, "a"), q(2, "a")];
    expect(scoreExam(small, { 1: "a", 2: "a" }).passed).toBe(true);
    expect(scoreExam(small, { 1: "a", 2: "b" }).passed).toBe(false);
  });
});

describe("formatClock", () => {
  it("pads minutes and seconds", () => {
    expect(formatClock(1145)).toBe("19:05");
    expect(formatClock(59)).toBe("00:59");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(-3)).toBe("00:00");
  });
});
