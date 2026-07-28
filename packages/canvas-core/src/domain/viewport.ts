export interface Viewport {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 4.0;

export const Viewport = {
  /**
   * デフォルトの表示範囲を生成する。
   * @returns 原点を中心とする等倍の表示範囲。
   */
  default: (): Viewport => ({ x: 0, y: 0, zoom: 1 }),
  /**
   * ズーム倍率を許容範囲内に収める。
   * @param zoom 調整するズーム倍率。
   * @returns 許容範囲内に収めたズーム倍率。
   */
  clampZoom: (zoom: number): number =>
    Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)),
};
