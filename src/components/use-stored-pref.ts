"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
/** Keeps a choice for this visit when storage is blocked. */
const memory = new Map<string, string>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/** A small preference kept in localStorage, readable during render without a hydration mismatch. */
export function useStoredPref<T extends string>(key: string, parse: (raw: unknown) => T, fallback: T): [T, (next: T) => void] {
  const read = () => {
    const mem = memory.get(key);
    if (mem !== undefined) return parse(mem);
    try {
      return parse(localStorage.getItem(key));
    } catch {
      return fallback;
    }
  };
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const set = useCallback(
    (next: T) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next);
      } catch {
        // Blocked: the in-memory copy still applies until the page closes.
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
