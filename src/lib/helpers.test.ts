import { describe, expect, it } from "vitest";
import { daysAgo } from "./format";
import { isTypingTarget, optionIndexForKey } from "./keys";
import { reportUrl } from "./report";
import { roundMinImages, ROUND_SIZES } from "./constants";

describe("daysAgo", () => {
  it("counts calendar days, not 24-hour blocks", () => {
    const now = new Date(2026, 8, 29, 9, 0).getTime();
    expect(daysAgo(new Date(2026, 8, 29, 0, 5).getTime(), now)).toBe(0);
    expect(daysAgo(new Date(2026, 8, 28, 23, 55).getTime(), now)).toBe(1);
    expect(daysAgo(new Date(2026, 8, 26, 12, 0).getTime(), now)).toBe(3);
  });

  it("never goes negative for a clock that moved backwards", () => {
    const now = new Date(2026, 8, 29, 9, 0).getTime();
    expect(daysAgo(now + 3 * 86400000, now)).toBe(0);
  });
});

describe("optionIndexForKey", () => {
  it("maps a-d and 1-4, any case, to an option index", () => {
    expect(optionIndexForKey("a", 4)).toBe(0);
    expect(optionIndexForKey("D", 4)).toBe(3);
    expect(optionIndexForKey("2", 4)).toBe(1);
  });

  it("ignores keys that do not match an existing option", () => {
    expect(optionIndexForKey("d", 3)).toBeNull();
    expect(optionIndexForKey("4", 3)).toBeNull();
    expect(optionIndexForKey("x", 4)).toBeNull();
    expect(optionIndexForKey("Enter", 4)).toBeNull();
    expect(optionIndexForKey("ab", 4)).toBeNull();
  });
});

describe("isTypingTarget", () => {
  it("is true for text fields and editable content", () => {
    expect(isTypingTarget({ tagName: "INPUT" } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "TEXTAREA" } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true } as unknown as EventTarget)).toBe(true);
  });

  it("is false for buttons, the page, and nothing", () => {
    expect(isTypingTarget({ tagName: "BUTTON" } as unknown as EventTarget)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("reportUrl", () => {
  it("opens a pre-filled GitHub issue that names the question", () => {
    const url = new URL(reportUrl({ id: 227, num: 256, text: "Umurongo ucagaguye wera mu muhanda usobanura iki?" }));
    expect(url.origin + url.pathname).toBe("https://github.com/tuyisengeaurele/questions-and-answers/issues/new");
    expect(url.searchParams.get("title")).toContain("256");
    expect(url.searchParams.get("body")).toContain("Umurongo ucagaguye");
    expect(url.searchParams.get("body")).toContain("227");
  });

  it("keeps a very long question within a sane URL length", () => {
    const url = reportUrl({ id: 1, num: 1, text: "x".repeat(5000) });
    expect(url.length).toBeLessThan(1800);
  });
});

describe("round sizes", () => {
  it("offers 10, 20 and 40 and scales the picture minimum with the size", () => {
    expect([...ROUND_SIZES]).toEqual([10, 20, 40]);
    expect(roundMinImages(10)).toBe(2);
    expect(roundMinImages(20)).toBe(4);
    expect(roundMinImages(40)).toBe(8);
  });
});
