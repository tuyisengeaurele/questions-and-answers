export type TextSize = "normal" | "large";

export const SIZE_KEY = "ikizamini:size";
export const LANG_KEY = "ikizamini:lang";
export const HIDE_ANSWERS_KEY = "ikizamini:browse-hide";
export const OFFLINE_KEY = "ikizamini:offline";

export const parseSize = (value: unknown): TextSize => (value === "large" ? "large" : "normal");

/** Runs in <head> so large text is applied before first paint. */
export const sizeInitScript = `try{if(localStorage.getItem(${JSON.stringify(SIZE_KEY)})==="large")document.documentElement.dataset.size="large"}catch(e){}`;
