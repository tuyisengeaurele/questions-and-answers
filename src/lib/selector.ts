import { hasImage } from "./questions";
import { shuffle, type Rand } from "./shuffle";
import type { Question } from "./types";

/** Pick `size` questions, guaranteeing `minImages` image questions when they exist. */
export function pickSet(
  pool: readonly Question[],
  size: number,
  minImages: number,
  rand: Rand = Math.random,
): Question[] {
  const withImg = shuffle(pool.filter(hasImage), rand);
  const without = shuffle(pool.filter((q) => !hasImage(q)), rand);
  const take = Math.min(minImages, withImg.length, size);
  const guaranteed = withImg.slice(0, take);
  const filler = shuffle([...without, ...withImg.slice(take)], rand).slice(0, size - take);
  return shuffle([...guaranteed, ...filler], rand);
}

/**
 * One practice round. `used` holds ids already served in the current pass over the pool;
 * once fewer than `size` fresh questions remain they are served first and a new pass begins.
 */
export function pickRound(
  pool: readonly Question[],
  used: readonly number[],
  size: number,
  minImages: number,
  rand: Rand = Math.random,
): { round: Question[]; used: number[] } {
  if (pool.length === 0) return { round: [], used: [...used] };
  const usedSet = new Set(used);
  const fresh = pool.filter((q) => !usedSet.has(q.id));
  if (fresh.length >= size) {
    const round = pickSet(fresh, size, minImages, rand);
    return { round, used: [...used, ...round.map((q) => q.id)] };
  }
  const freshIds = new Set(fresh.map((q) => q.id));
  const rest = pool.filter((q) => !freshIds.has(q.id));
  const stillNeeded = Math.max(0, minImages - fresh.filter(hasImage).length);
  const topUp = pickSet(rest, size - fresh.length, stillNeeded, rand);
  return {
    round: shuffle([...fresh, ...topUp], rand),
    used: topUp.map((q) => q.id),
  };
}
