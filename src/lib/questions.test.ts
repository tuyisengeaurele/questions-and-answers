import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { byId, hasImage, questions } from "./questions";

const pub = (src: string) => path.join(process.cwd(), "public", src);

describe("questions.json", () => {
  it("has questions with unique ids", () => {
    expect(questions.length).toBeGreaterThan(100);
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
    expect(byId.size).toBe(questions.length);
  });

  it("gives every question 2-4 options in a,b,c,d order and one valid answer", () => {
    for (const q of questions) {
      expect(q.options.length, `q${q.id} options`).toBeGreaterThanOrEqual(2);
      expect(q.options.length, `q${q.id} options`).toBeLessThanOrEqual(4);
      expect(q.options.map((o) => o.key), `q${q.id} keys`).toEqual(["a", "b", "c", "d"].slice(0, q.options.length));
      expect(q.options.some((o) => o.key === q.answer), `q${q.id} answer`).toBe(true);
    }
  });

  it("never shows an empty question or an empty option", () => {
    for (const q of questions) {
      expect(q.text.length + (q.image ? 1 : 0), `q${q.id} stem`).toBeGreaterThan(0);
      for (const o of q.options) expect(o.text.length + (o.image ? 1 : 0), `q${q.id}${o.key}`).toBeGreaterThan(0);
    }
  });

  it("only references image files that exist", () => {
    for (const q of questions) {
      const pics = [q.image, ...q.options.map((o) => o.image)].filter(Boolean);
      for (const p of pics) expect(existsSync(pub(p!.src)), `q${q.id} ${p!.src}`).toBe(true);
    }
  });

  it("has enough image questions for the exam minimum", () => {
    expect(questions.filter(hasImage).length).toBeGreaterThanOrEqual(4);
  });
});
