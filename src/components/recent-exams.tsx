"use client";

import { useT } from "@/components/lang-provider";
import { daysAgo } from "@/lib/format";
import type { ExamResult } from "@/lib/progress";

export function RecentExams({ exams, now }: { exams: ExamResult[]; now: number }) {
  const { t, lang } = useT();
  if (exams.length === 0) return null;

  const when = (at: number) => {
    const days = daysAgo(at, now);
    if (days === 0) return t("when.today");
    if (days === 1) return t("when.yesterday");
    return new Intl.DateTimeFormat(lang === "rw" ? "rw" : "en-GB", { day: "numeric", month: "short" }).format(at);
  };

  return (
    <div>
      <h2 className="mb-2 text-sm font-medium text-mute">{t("home.recent")}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
        {exams.slice(0, 5).map((e) => (
          <li key={e.at} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="tabular text-lg font-semibold">
              {e.correct}
              <span className="text-mute">/{e.total}</span>
            </span>
            <span className={`text-sm font-medium ${e.passed ? "text-accent" : "text-bad"}`}>
              {e.passed ? t("exam.passed") : t("exam.failed")}
            </span>
            <span className="text-sm text-mute">{when(e.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
