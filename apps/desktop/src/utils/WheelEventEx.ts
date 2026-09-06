type WheelPage = Pick<HTMLElement, "clientWidth" | "clientHeight">;

/** DOM WheelEvent に対する汎用の変換。 */
export const WheelEventEx = {
  /**
   * wheel の移動量をピクセル単位へ変換する。
   *
   * @param event 変換するwheelイベント。
   * @param page ページ単位の基準にする表示領域。
   * @returns ピクセル単位の水平・垂直移動量。
   */
  toPixelDelta(
    event: WheelEvent,
    page: WheelPage,
  ): Readonly<{ x: number; y: number }> {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
      return { x: event.deltaX * 16, y: event.deltaY * 16 };
    }
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
      return {
        x: event.deltaX * page.clientWidth,
        y: event.deltaY * page.clientHeight,
      };
    }
    return { x: event.deltaX, y: event.deltaY };
  },
} as const;
