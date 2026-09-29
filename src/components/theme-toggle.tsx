"use client";

import { effectiveTheme, parseTheme, THEME_KEY, toggled } from "@/lib/theme";

const BG = { light: "#f2f3ee", dark: "#131518" } as const;

function toggleTheme() {
  const root = document.documentElement;
  const current = effectiveTheme(parseTheme(root.dataset.theme), window.matchMedia("(prefers-color-scheme: light)").matches);
  const next = toggled(current);
  root.dataset.theme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.removeAttribute("media");
    m.setAttribute("content", BG[next]);
  });
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch between light and dark theme"
      title="Switch theme"
      className="press flex size-12 items-center justify-center rounded-xl text-mute hover:text-text"
    >
      <svg
        viewBox="0 0 24 24"
        className="icon-sun size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="icon-moon size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
      </svg>
    </button>
  );
}
