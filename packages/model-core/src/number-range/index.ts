/**
 * 制約の数値範囲。
 * 片側開放を許容し、「下限・上限とも無い」状態は表現できない。
 */
export type NumberRange =
  | Readonly<{ bound: "both"; min: number; max: number }>
  | Readonly<{ bound: "minOnly"; min: number }>
  | Readonly<{ bound: "maxOnly"; max: number }>;

const SOURCE_NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  notation: "standard",
  useGrouping: false,
});

/**
 * 範囲の端点を DSL の数字列にする。指数表記は使わない。
 * @param value 範囲の端点。
 * @returns 桁を並べた数字列。
 */
const toSourceBound = (value: number): string =>
  SOURCE_NUMBER_FORMAT.format(value);

/** 数値範囲を生成する関数群。min > max の検証はパーサ側の責務。 */
export const NumberRange = {
  /**
   * 下限と上限の両方を持つ範囲を生成する。
   * @param min 下限。
   * @param max 上限。
   * @returns 両端付きの数値範囲。
   */
  both: (min: number, max: number): NumberRange => ({
    bound: "both",
    min,
    max,
  }),
  /**
   * 下限のみの範囲を生成する。
   * @param min 下限。
   * @returns 下限のみの数値範囲。
   */
  minOnly: (min: number): NumberRange => ({ bound: "minOnly", min }),
  /**
   * 上限のみの範囲を生成する。
   * @param max 上限。
   * @returns 上限のみの数値範囲。
   */
  maxOnly: (max: number): NumberRange => ({ bound: "maxOnly", max }),
  /**
   * 制約構文と同じ範囲表記にする(model-format.md §6)。
   * @param range 数値範囲。
   * @returns `1..100` / `1..` / `..100`。
   */
  toSource: (range: NumberRange): string => {
    switch (range.bound) {
      case "both":
        return `${toSourceBound(range.min)}..${toSourceBound(range.max)}`;
      case "minOnly":
        return `${toSourceBound(range.min)}..`;
      case "maxOnly":
        return `..${toSourceBound(range.max)}`;
    }
  },
} as const;
