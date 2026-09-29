export type Theme = "light" | "dark";

export const THEME_KEY = "ikizamini:theme";

export const parseTheme = (value: unknown): Theme | null => (value === "light" || value === "dark" ? value : null);

export const effectiveTheme = (stored: Theme | null, prefersLight: boolean): Theme =>
  stored ?? (prefersLight ? "light" : "dark");

export const toggled = (theme: Theme): Theme => (theme === "dark" ? "light" : "dark");

/** Runs in <head> before first paint so a saved choice never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
