"use client";

import { useT } from "@/components/lang-provider";
import { nextPref, parsePref, THEME_KEY, type ThemePref } from "@/lib/theme";

const BG = { light: "#f2f3ee", dark: "#131518" } as const;

function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  root.dataset.pref = pref;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  // The browser bar colour: two tags with light and dark media queries, in that order.
  const [light, dark] = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
  light?.setAttribute("content", pref === "dark" ? BG.dark : BG.light);
  dark?.setAttribute("content", pref === "light" ? BG.light : BG.dark);
}

function cycle() {
  applyPref(nextPref(parsePref(document.documentElement.dataset.pref)));
}

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ThemeToggle() {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={t("theme.change")}
      title={t("theme.change")}
      className="press flex size-12 items-center justify-center rounded-xl text-mute hover:text-text"
    >
      <svg viewBox="0 0 24 24" className="pref-icon pref-system size-5" aria-hidden {...icon}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </svg>
      <svg viewBox="0 0 24 24" className="pref-icon pref-light size-5" aria-hidden {...icon}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </svg>
      <svg viewBox="0 0 24 24" className="pref-icon pref-dark size-5" aria-hidden {...icon}>
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
      </svg>
    </button>
  );
}
