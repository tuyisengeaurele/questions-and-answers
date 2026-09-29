"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { QuestionCard } from "@/components/question-card";
import { hasImage, questions } from "@/lib/questions";

const PAGE = 25;
const norm = (s: string) => s.toLowerCase();

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [imagesOnly, setImagesOnly] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const deferred = useDeferredValue(query);

  const results = useMemo(() => {
    const q = norm(deferred.trim());
    return questions.filter((x) => {
      if (imagesOnly && !hasImage(x)) return false;
      if (!q) return true;
      return norm(x.text).includes(q) || x.options.some((o) => norm(o.text).includes(q)) || String(x.num) === q;
    });
  }, [deferred, imagesOnly]);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Browse</h1>
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Search questions or a number"
          aria-label="Search questions"
          className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 outline-none transition-colors focus:border-lime"
        />
        <button
          onClick={() => {
            setImagesOnly((v) => !v);
            setShown(PAGE);
          }}
          aria-pressed={imagesOnly}
          className={`press min-h-12 rounded-xl px-4 text-sm font-medium ${
            imagesOnly ? "bg-lime text-on-lime" : "border border-line text-mute"
          }`}
        >
          With pictures
        </button>
      </div>
      <p className="tabular text-sm text-mute">{results.length} questions</p>
      {results.length === 0 && <p className="text-mute">Nothing matches that.</p>}
      <ol className="space-y-8">
        {results.slice(0, shown).map((q) => (
          <li key={q.id} className="border-b border-line pb-8">
            <p className="tabular mb-2 text-sm text-mute">#{q.num}</p>
            <QuestionCard question={q} reveal disabled />
          </li>
        ))}
      </ol>
      {shown < results.length && (
        <button
          onClick={() => setShown((n) => n + PAGE)}
          className="press min-h-14 w-full rounded-2xl border border-line font-medium"
        >
          Show more
        </button>
      )}
    </section>
  );
}
