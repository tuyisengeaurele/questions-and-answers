import { hasImage } from "./questions";
import { shuffle, type Rand } from "./shuffle";
import type { Question } from "./types";

/**
 * Pick `size` questions, guaranteeing `minImages` image questions when they exist.
 * `maxImages` caps how many image questions the filler may add on top of the guaranteed ones.
 */
export function pickSet(
  pool: readonly Question[],
  size: number,
  minImages: number,
  rand: Rand = Math.random,
  maxImages: number = Infinity,
): Question[] {
  const withImg = shuffle(pool.filter(hasImage), rand);
  const without = shuffle(pool.filter((q) => !hasImage(q)), rand);
  const take = Math.min(minImages, withImg.length, size);
  const guaranteed = withImg.slice(0, take);
  const optional = withImg.slice(take);
  const allowed = optional.slice(0, Math.max(0, maxImages - take));
  const spare = optional.slice(allowed.length);
  const filler = [...shuffle([...without, ...allowed], rand), ...spare].slice(0, size - take);
  return shuffle([...guaranteed, ...filler], rand);
}

/**
 * One practice round. `used` holds the ids answered so far in the current pass over the pool.
 * The round itself is not marked: a question counts once it is answered. When fewer than `size`
 * fresh questions remain they are served first and the returned `used` is empty, a new pass.
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
    // Spread image questions evenly over the pass so the last rounds still have some.
    const freshImages = fresh.filter(hasImage).length;
    const target = Math.max(minImages, Math.round((size * freshImages) / fresh.length));
    return { round: pickSet(fresh, size, target, rand, target), used: [...used] };
  }
  const freshIds = new Set(fresh.map((q) => q.id));
  const rest = pool.filter((q) => !freshIds.has(q.id));
  const stillNeeded = Math.max(0, minImages - fresh.filter(hasImage).length);
  const topUp = pickSet(rest, size - fresh.length, stillNeeded, rand);
  return { round: shuffle([...fresh, ...topUp], rand), used: [] };
}
