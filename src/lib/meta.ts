import meta from "../../data/meta.json";

/** Question count and picture list, without pulling in every question. */
export const questionCount: number = meta.count;
export const pictureSources: string[] = meta.images;
