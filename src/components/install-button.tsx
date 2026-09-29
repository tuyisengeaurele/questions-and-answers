"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/lang-provider";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

/** Shown only where the browser offers to install the app. */
export function InstallButton() {
  const { t } = useT();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;
  return (
    <button
      type="button"
      onClick={() => {
        void prompt.prompt();
        setPrompt(null);
      }}
      className="press min-h-12 rounded-xl border border-line px-4 text-sm font-medium"
    >
      {t("install.button")}
    </button>
  );
}
