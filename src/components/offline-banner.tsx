"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/components/lang-provider";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function OfflineBanner() {
  const { t } = useT();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <p role="status" className="rise mx-auto mb-4 max-w-2xl rounded-xl border border-line bg-panel px-4 py-3 text-sm text-mute">
      {t("offline.banner")}
    </p>
  );
}
