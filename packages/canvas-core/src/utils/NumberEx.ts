/** `number` に対する汎用の判定・変換。 */
export const NumberEx = {
  /**
   * 値が有限の number か判定する。
   * `NaN` / `Infinity` / `-Infinity` および number 以外は `false`。
   * @param value 判定する値。
   * @returns 有限の number の場合は `true`。
   */
  isFinite: (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value),
} as const;
