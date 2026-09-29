import { describe, expect, it } from "vitest";
import { en, parseLang, rw, translate, translatePlural } from "./i18n";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("interface texts", () => {
  it("has the same keys in English and Kinyarwanda", () => {
    expect(Object.keys(rw).sort()).toEqual(Object.keys(en).sort());
  });

  it("never leaves a text empty", () => {
    for (const [key, text] of [...Object.entries(en), ...Object.entries(rw)]) {
      expect(text.trim().length, key).toBeGreaterThan(0);
    }
  });

  it("uses the same placeholders in both languages", () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(rw[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("gives every plural base both forms", () => {
    const bases = Object.keys(en).filter((k) => k.endsWith("_one")).map((k) => k.slice(0, -4));
    for (const base of bases) expect(Object.keys(en), base).toContain(`${base}_other`);
  });
});

describe("translate", () => {
  it("fills placeholders and leaves an unknown one visible", () => {
    expect(translate("en", "home.seenOf", { seen: 12, total: 399 })).toBe("12 of 399");
    expect(translate("rw", "home.seenOf", { seen: 12, total: 399 })).toBe("12 kuri 399");
    expect(translate("en", "home.seenOf", { seen: 1 })).toBe("1 of {total}");
  });

  it("chooses the singular for exactly one", () => {
    expect(translatePlural("en", "browse.count", 1)).toBe("1 question");
    expect(translatePlural("en", "browse.count", 0)).toBe("0 questions");
    expect(translatePlural("en", "browse.count", 7)).toBe("7 questions");
  });

  it("falls back to English for an unknown language code", () => {
    expect(parseLang("rw")).toBe("rw");
    expect(parseLang("fr")).toBe("en");
    expect(parseLang(null)).toBe("en");
  });
});
