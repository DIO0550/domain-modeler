/** 配列に対する汎用の判定・変換。 */
export const ArrayEx = {
  /**
   * 範囲を超えた index を循環させて要素を返す。
   *
   * @param items 対象の配列。
   * @param index 正負どちらでもよい位置。
   * @returns 循環後の位置の要素。空配列なら undefined。
   */
  atWrapped<T>(items: readonly T[], index: number): T | undefined {
    if (items.length === 0) {
      return undefined;
    }
    const wrapped = ((index % items.length) + items.length) % items.length;
    return items[wrapped];
  },
} as const;
