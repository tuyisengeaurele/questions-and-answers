"use client";

import { useEffect, useRef, useState } from "react";

/** Remaining whole seconds; calls onEnd once when it reaches zero. Based on a deadline, so it does not drift. */
export function useCountdown(seconds: number, onEnd: () => void): number {
  const [left, setLeft] = useState(seconds);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    const deadline = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        clearInterval(id);
        onEndRef.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);

  return left;
}
