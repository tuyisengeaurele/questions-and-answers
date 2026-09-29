"use client";

import { useEffect } from "react";
import { questions } from "@/lib/questions";

const ROUTES = ["/", "/practice", "/exam", "/browse"];

export function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        const warm = () => {
          ROUTES.forEach((r) => fetch(r).catch(() => {}));
          const srcs = new Set<string>();
          for (const q of questions) {
            if (q.image) srcs.add(q.image.src);
            q.options.forEach((o) => o.image && srcs.add(o.image.src));
          }
          srcs.forEach((s) => fetch(s).catch(() => {}));
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(warm);
        else setTimeout(warm, 3000);
      })
      .catch(() => {});
  }, []);
  return null;
}
