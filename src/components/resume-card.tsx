"use client";

import { useT } from "@/components/lang-provider";

interface Props {
  title: string;
  detail: string;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumeCard({ title, detail, onResume, onDiscard }: Props) {
  const { t } = useT();
  return (
    <div className="rise rounded-2xl border border-accent bg-panel p-4">
      <p className="font-semibold">{title}</p>
      <p className="tabular mt-0.5 text-sm text-mute">{detail}</p>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button onClick={onDiscard} className="press min-h-12 rounded-xl border border-line text-sm font-medium">
          {t("resume.discard")}
        </button>
        <button onClick={onResume} className="press min-h-12 rounded-xl bg-lime text-sm font-semibold text-on-lime">
          {t("resume.button")}
        </button>
      </div>
    </div>
  );
}
