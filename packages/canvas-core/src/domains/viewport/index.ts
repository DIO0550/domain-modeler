import type { Point } from "../point";
import { Size, type Sticky } from "../sticky";

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
  /**
   * ワールド座標の点をスクリーン座標へ変換する。
   * @param viewport 座標変換に使用する表示範囲。
   * @param point 変換するワールド座標の点。
   * @returns 変換後のスクリーン座標。
   */
  worldToScreen: (viewport: Viewport, point: Point): Point => ({
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  }),
  /**
   * スクリーン座標の点をワールド座標へ変換する。
   * @param viewport 座標変換に使用する表示範囲。
   * @param point 変換するスクリーン座標の点。
   * @returns 変換後のワールド座標。
   */
  screenToWorld: (viewport: Viewport, point: Point): Point => ({
    x: (point.x - viewport.x) / viewport.zoom,
    y: (point.y - viewport.y) / viewport.zoom,
  }),
  /**
   * ワールド座標系のサイズをスクリーン座標系へ変換する。
   * @param viewport 座標変換に使用する表示範囲。
   * @param size 変換するワールド座標系のサイズ。
   * @returns 変換後のスクリーン座標系のサイズ。
   */
  worldSizeToScreen: (viewport: Viewport, size: Size): Size => ({
    width: size.width * viewport.zoom,
    height: size.height * viewport.zoom,
  }),
  /**
   * スクリーン座標系のサイズをワールド座標系へ変換する。
   * @param viewport 座標変換に使用する表示範囲。
   * @param size 変換するスクリーン座標系のサイズ。
   * @returns 変換後のワールド座標系のサイズ。
   */
  screenSizeToWorld: (viewport: Viewport, size: Size): Size => ({
    width: size.width / viewport.zoom,
    height: size.height / viewport.zoom,
  }),
  /**
   * 表示範囲をスクリーン座標系の移動量だけパンする。
   * @param viewport 移動前の表示範囲。
   * @param delta スクリーン座標系の相対移動量。
   * @returns 移動後の表示範囲。
   */
  pan: (viewport: Viewport, delta: Point): Viewport => ({
    ...viewport,
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
  }),
  /**
   * 全付箋が画面内へ収まる表示範囲を生成する。
   * @param stickies 表示する付箋。
   * @param screenSize 表示領域のスクリーン座標系サイズ。
   * @returns 付箋全体を中央へ収めた表示範囲。付箋が無いか表示領域が不正なら既定値。
   */
  fitStickies: (
    stickies: readonly Sticky[],
    screenSize: Size,
  ): Viewport => {
    const [first, ...rest] = stickies;
    if (first === undefined || !Size.isValid(screenSize)) {
      return Viewport.default();
    }
    const bounds = rest.reduce(
      (current, sticky) => ({
        left: Math.min(current.left, sticky.position.x),
        top: Math.min(current.top, sticky.position.y),
        right: Math.max(
          current.right,
          sticky.position.x + sticky.size.width,
        ),
        bottom: Math.max(
          current.bottom,
          sticky.position.y + sticky.size.height,
        ),
      }),
      {
        left: first.position.x,
        top: first.position.y,
        right: first.position.x + first.size.width,
        bottom: first.position.y + first.size.height,
      },
    );
    const boundsSize = {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    };
    const zoom = Viewport.clampZoom(
      Math.min(
        screenSize.width / boundsSize.width,
        screenSize.height / boundsSize.height,
      ),
    );
    const boundsCenter = {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
    };
    return {
      x: screenSize.width / 2 - boundsCenter.x * zoom,
      y: screenSize.height / 2 - boundsCenter.y * zoom,
      zoom,
    };
  },
  /**
   * 指定したスクリーン座標を不動点として表示範囲をズームする。
   * @param viewport ズーム前の表示範囲。
   * @param zoom 適用するズーム倍率。許容範囲外の場合はクランプする。
   * @param fixedPoint ズーム前後で位置を維持するスクリーン座標。
   * @returns ズーム倍率とパン位置を調整した表示範囲。
   */
  zoomAt: (
    viewport: Viewport,
    zoom: number,
    fixedPoint: Point,
  ): Viewport => {
    const nextZoom = Viewport.clampZoom(zoom);
    const worldPoint = Viewport.screenToWorld(viewport, fixedPoint);

    return {
      x: fixedPoint.x - worldPoint.x * nextZoom,
      y: fixedPoint.y - worldPoint.y * nextZoom,
      zoom: nextZoom,
    };
  },
};
