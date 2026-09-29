/** Index of the option a key press stands for: a-d or 1-4 in any case, or null. */
export function optionIndexForKey(key: string, count: number): number | null {
  if (key.length !== 1) return null;
  const k = key.toLowerCase();
  const index = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
  return index >= 0 && index < count ? index : null;
}

/** True when a key press is meant for a text field, not for the page. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as { tagName?: string; isContentEditable?: boolean };
  const tag = el.tagName?.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(el.isContentEditable);
}
