/** ステータスバーに出すズーム表示。 */
export type ZoomLabel = `${number}%`;

/** ビューポートのズーム倍率を表示文字列へ変換する関数群。 */
export const ZoomLabel = {
  /**
   * ズーム倍率を百分率のラベルにする。
   *
   * @param zoom ビューポートのズーム倍率。
   * @returns 四捨五入した百分率。例: 1 → 100%。
   */
  toPercent(zoom: number): ZoomLabel {
    return `${Math.round(zoom * 100)}%`;
  },
} as const;
