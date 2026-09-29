"use client";

import { useEffect, useRef } from "react";
import { isTypingTarget } from "@/lib/keys";

/** Calls `handler` for key presses meant for the page: not while typing, not with shortcuts, not behind a modal. */
export function useKeys(handler: (e: KeyboardEvent) => void, enabled = true) {
  const ref = useRef(handler);
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (isTypingTarget(e.target) || document.querySelector("dialog[open]")) return;
      ref.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}

/** True when the focused element is a button or link, which already reacts to Enter and Space. */
export function focusIsOnControl(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === "BUTTON" || tag === "A";
}
