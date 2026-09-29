import raw from "../../data/questions.json";
import type { Question } from "./types";

export const questions = raw as Question[];
export const byId = new Map(questions.map((q) => [q.id, q]));

export const hasImage = (q: Question): boolean => Boolean(q.image) || q.options.some((o) => o.image);
