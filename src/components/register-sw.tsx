"use client";

import { useEffect } from "react";
import { pictureSources } from "@/lib/meta";
import { OFFLINE_KEY } from "@/lib/prefs";

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(async () => {
        // On the first visit the worker only starts controlling the page a moment after it is ready.
        if (!navigator.serviceWorker.controller) {
          await new Promise<void>((resolve) => {
            navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
            setTimeout(resolve, 4000);
          });
        }
        const warm = () => {
          void Promise.allSettled(pictureSources.map((s) => fetch(s))).then(() => {
            try {
              localStorage.setItem(OFFLINE_KEY, "1");
            } catch {
              // Storage blocked: the "works offline" note simply stays hidden.
            }
          });
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(warm);
        else setTimeout(warm, 3000);
      })
      .catch(() => {});
  }, []);
  return null;
}
