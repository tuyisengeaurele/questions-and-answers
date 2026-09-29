import { describe, expect, it } from "vitest";
import { parseSize, sizeInitScript } from "./prefs";

describe("text size preference", () => {
  it("accepts only large, everything else is normal", () => {
    expect(parseSize("large")).toBe("large");
    expect(parseSize("normal")).toBe("normal");
    expect(parseSize("huge")).toBe("normal");
    expect(parseSize(null)).toBe("normal");
  });

  const run = (getItem: () => string | null) => {
    const root = { dataset: {} as Record<string, string> };
    new Function("document", "localStorage", sizeInitScript)({ documentElement: root }, { getItem });
    return root.dataset;
  };

  it("applies large text before first paint and leaves the default alone", () => {
    expect(run(() => "large")).toEqual({ size: "large" });
    expect(run(() => null)).toEqual({});
    expect(run(() => "purple")).toEqual({});
  });

  it("does not throw when storage is blocked", () => {
    expect(() => run(() => { throw new Error("blocked"); })).not.toThrow();
  });
});
