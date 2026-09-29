import { describe, expect, it } from "vitest";
import { effectiveTheme, nextPref, parsePref, themeInitScript } from "./theme";

describe("theme helpers", () => {
  it("accepts only light, dark or system from storage", () => {
    expect(parsePref("light")).toBe("light");
    expect(parsePref("dark")).toBe("dark");
    expect(parsePref("system")).toBe("system");
    expect(parsePref("blue")).toBe("system");
    expect(parsePref(null)).toBe("system");
  });

  it("follows the system for the system choice, and the choice otherwise", () => {
    expect(effectiveTheme("system", true)).toBe("light");
    expect(effectiveTheme("system", false)).toBe("dark");
    expect(effectiveTheme("dark", true)).toBe("dark");
    expect(effectiveTheme("light", false)).toBe("light");
  });

  it("cycles system, light, dark, system", () => {
    expect(nextPref("system")).toBe("light");
    expect(nextPref("light")).toBe("dark");
    expect(nextPref("dark")).toBe("system");
  });
});

describe("themeInitScript", () => {
  const run = (getItem: () => string | null) => {
    const root = { dataset: {} as Record<string, string> };
    new Function("document", "localStorage", themeInitScript)({ documentElement: root }, { getItem });
    return root.dataset;
  };

  it("applies a stored theme before first paint", () => {
    expect(run(() => "light")).toEqual({ theme: "light", pref: "light" });
    expect(run(() => "dark")).toEqual({ theme: "dark", pref: "dark" });
  });

  it("marks the system choice without forcing a theme, for missing or invalid values", () => {
    expect(run(() => null)).toEqual({ pref: "system" });
    expect(run(() => "purple")).toEqual({ pref: "system" });
  });

  it("does not throw when storage is blocked", () => {
    expect(() => run(() => { throw new Error("blocked"); })).not.toThrow();
  });
});
