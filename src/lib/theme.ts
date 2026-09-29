export type Theme = "light" | "dark";
export type ThemePref = Theme | "system";

export const THEME_KEY = "ikizamini:theme";

export const parsePref = (value: unknown): ThemePref => (value === "light" || value === "dark" ? value : "system");

export const effectiveTheme = (pref: ThemePref, prefersLight: boolean): Theme =>
  pref === "system" ? (prefersLight ? "light" : "dark") : pref;

export const nextPref = (pref: ThemePref): ThemePref => (pref === "system" ? "light" : pref === "light" ? "dark" : "system");

/** Runs in <head> before first paint so a saved choice never flashes the wrong theme. */
export const themeInitScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});var r=document.documentElement;if(t==="light"||t==="dark"){r.dataset.theme=t;r.dataset.pref=t}else{r.dataset.pref="system"}}catch(e){document.documentElement.dataset.pref="system"}`;
