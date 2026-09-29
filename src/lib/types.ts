export type OptionKey = "a" | "b" | "c" | "d";

export interface Pic {
  src: string;
  w: number;
  h: number;
}

export interface Option {
  key: OptionKey;
  text: string;
  image?: Pic;
}

export interface Question {
  id: number;
  num: number;
  text: string;
  image?: Pic;
  options: Option[];
  answer: OptionKey;
}
