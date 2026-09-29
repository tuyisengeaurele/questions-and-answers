import { describe, expect, it } from "vitest";
import { effectiveTheme, parseTheme, themeInitScript, toggled } from "./theme";

describe("theme helpers", () => {
  it("accepts only light or dark from storage", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("blue")).toBeNull();
    expect(parseTheme(null)).toBeNull();
  });

  it("follows the system when nothing is stored, and the stored choice otherwise", () => {
    expect(effectiveTheme(null, true)).toBe("light");
    expect(effectiveTheme(null, false)).toBe("dark");
    expect(effectiveTheme("dark", true)).toBe("dark");
    expect(effectiveTheme("light", false)).toBe("light");
  });

  it("toggles between the two", () => {
    expect(toggled("dark")).toBe("light");
    expect(toggled("light")).toBe("dark");
  });
});

describe("themeInitScript", () => {
  const run = (getItem: () => string | null) => {
    const root = { dataset: {} as Record<string, string> };
    new Function("document", "localStorage", themeInitScript)({ documentElement: root }, { getItem });
    return root.dataset.theme;
  };

  it("applies a stored theme before first paint", () => {
    expect(run(() => "light")).toBe("light");
    expect(run(() => "dark")).toBe("dark");
  });

  it("leaves the system default alone for missing or invalid values", () => {
    expect(run(() => null)).toBeUndefined();
    expect(run(() => "purple")).toBeUndefined();
  });

  it("does not throw when storage is blocked", () => {
    expect(run(() => { throw new Error("blocked"); })).toBeUndefined();
  });
});
