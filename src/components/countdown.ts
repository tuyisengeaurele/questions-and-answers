"use client";

import { useEffect, useRef, useState } from "react";

const secondsLeft = (endsAt: number) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

/** Whole seconds until `endsAt` (a timestamp). Calls onEnd once at zero. Based on the deadline, so it does not drift or restart. */
export function useCountdown(endsAt: number, onEnd: () => void): number {
  const [left, setLeft] = useState(() => secondsLeft(endsAt));
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = secondsLeft(endsAt);
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        onEndRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  return left;
}
