"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { parseLang, translate, translatePlural, type Key, type Lang, type Vars } from "@/lib/i18n";
import { LANG_KEY } from "@/lib/prefs";
import { useStoredPref } from "@/components/use-stored-pref";

interface Value {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: Key, vars?: Vars) => string;
  tn: (base: Parameters<typeof translatePlural>[1], n: number, vars?: Vars) => string;
}

const Ctx = createContext<Value | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useStoredPref<Lang>(LANG_KEY, parseLang, "en");

  useEffect(() => {
    document.documentElement.lang = lang === "rw" ? "rw" : "en";
  }, [lang]);

  const t = useCallback((key: Key, vars?: Vars) => translate(lang, key, vars), [lang]);
  const tn = useCallback(
    (base: Parameters<typeof translatePlural>[1], n: number, vars?: Vars) => translatePlural(lang, base, n, vars),
    [lang],
  );
  const value = useMemo(() => ({ lang, setLang, t, tn }), [lang, setLang, t, tn]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useT must be used inside LangProvider");
  return v;
}
