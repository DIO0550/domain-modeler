/**
 * 制約の数値範囲。
 * 片側開放を許容し、「下限・上限とも無い」状態は表現できない。
 */
export type NumberRange =
  | Readonly<{ bound: "both"; min: number; max: number }>
  | Readonly<{ bound: "minOnly"; min: number }>
  | Readonly<{ bound: "maxOnly"; max: number }>;

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
} as const;
