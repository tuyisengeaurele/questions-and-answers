import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import meta from "../../data/meta.json";
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

  it("puts pictures on the question, or on every option, never on just some options", () => {
    for (const q of questions) {
      const withPic = q.options.filter((o) => o.image).length;
      expect([0, q.options.length], `q${q.id}`).toContain(withPic);
      if (withPic) expect(q.image, `q${q.id} has both a question picture and option pictures`).toBeUndefined();
      for (const o of q.options) if (o.image) expect(o.text, `q${q.id}${o.key} has text and a picture`).toBe("");
    }
  });

  it("has tidy text: no stray brackets, double spaces, or space before punctuation", () => {
    for (const q of questions) {
      for (const [where, t] of [["stem", q.text], ...q.options.map((o) => [o.key, o.text] as const)]) {
        if (!t) continue;
        expect(t, `q${q.id} ${where}`).toBe(t.trim());
        expect(t, `q${q.id} ${where} double space`).not.toMatch(/\s{2,}/);
        expect(t, `q${q.id} ${where} space before punctuation`).not.toMatch(/\s[?,.:;!]/);
        expect(t, `q${q.id} ${where} stray bracket`).not.toMatch(/^\)/);
      }
      expect(q.text[0], `q${q.id} stem starts lowercase`).toBe(q.text[0].toUpperCase());
    }
  });

  it("has no repeated questions", () => {
    const seen = new Map<string, number>();
    for (const q of questions) {
      const key = JSON.stringify([q.text.toLowerCase(), q.options.map((o) => [o.text.toLowerCase(), o.image?.src]), q.image?.src, q.answer]);
      expect(seen.has(key), `q${q.id} repeats q${seen.get(key)}`).toBe(false);
      seen.set(key, q.id);
    }
  });

  it("only references image files that exist", () => {
    for (const q of questions) {
      const pics = [q.image, ...q.options.map((o) => o.image)].filter(Boolean);
      for (const p of pics) expect(existsSync(pub(p!.src)), `q${q.id} ${p!.src}`).toBe(true);
    }
  });

  it("has a meta file that matches the questions, so pages can avoid loading them all", () => {
    expect(meta.count).toBe(questions.length);
    const srcs = new Set<string>();
    for (const q of questions) {
      if (q.image) srcs.add(q.image.src);
      for (const o of q.options) if (o.image) srcs.add(o.image.src);
    }
    expect([...meta.images].sort()).toEqual([...srcs].sort());
  });

  it("has enough image questions for the exam minimum", () => {
    expect(questions.filter(hasImage).length).toBeGreaterThanOrEqual(4);
  });
});
