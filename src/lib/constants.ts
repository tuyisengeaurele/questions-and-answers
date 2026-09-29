export const ROUND_SIZES = [10, 20, 40] as const;
export const DEFAULT_ROUND_SIZE = 10;
/** About one question in five is a picture question, never fewer than two. */
export const roundMinImages = (size: number): number => Math.max(2, Math.round(size * 0.2));
export const EXAM_SIZE = 20;
export const EXAM_PASS = 12;
export const EXAM_MIN_IMAGES = 4;
export const EXAM_SECONDS = 20 * 60;
