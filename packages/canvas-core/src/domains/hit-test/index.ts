import type { Connection } from "../connection";
import type { Document } from "../document";
import { ConnectionSegment } from "../connection-segment";
import type { Point } from "../point";
import type { Sticky } from "../sticky";
import { Sticky as StickyCompanion } from "../sticky";
import { StickyIndex } from "../sticky-index";
import { type Option, Option as OptionValue } from "../option";

/** ヒットテスト関連の機能群。 */
export const HitTest = {
  /**
   * ワールド座標にある最前面の付箋を取得する。
   * @param doc ヒットテスト対象の文書。
   * @param point ワールド座標。
   * @returns 座標にある最前面の付箋。該当する付箋がなければ値なし。
   */
  stickyAt: (doc: Document, point: Point): Option<Sticky> =>
    doc.stickies.reduceRight<Option<Sticky>>(
      (hit, sticky) =>
        hit.some || !StickyCompanion.contains(sticky, point) ? hit : OptionValue.some(sticky),
      OptionValue.none(),
    ),

  /**
   * ワールド座標にある最後に追加された接続を取得する。
   * @param doc ヒットテスト対象の文書。
   * @param point ワールド座標。
   * @param tolerance ワールド座標系の許容距離。
   *   画面上の許容距離（通常 8px）をズーム倍率で割った値を呼び出し側で計算して渡す。
   *   例: tolerance = 8 / zoom
   * @returns 座標にある接続。該当する接続がなければ値なし。
   */
  connectionAt: (
    doc: Document,
    point: Point,
    tolerance: number,
  ): Option<Connection> => {
    const stickyIndex = StickyIndex.create(doc.stickies);
    return doc.connections.reduceRight<Option<Connection>>(
      (hit, connection) => {
        if (hit.some) {
          return hit;
        }
        const segment = ConnectionSegment.create(stickyIndex, connection);
        return segment.some &&
          ConnectionSegment.contains(segment.value, point, tolerance)
          ? OptionValue.some(connection)
          : hit;
      },
      OptionValue.none(),
    );
  },

  /**
   * 接続線からの最短距離を取得する。
   * @param doc 接続を含む文書。
   * @param connection 距離を測る接続。
   * @param point ワールド座標。
   * @returns 接続線からの最短距離。接続線を生成できない場合は値なし。
   */
  distanceToConnection: (
    doc: Document,
    connection: Connection,
    point: Point,
  ): Option<number> => {
    const stickyIndex = StickyIndex.create(doc.stickies);
    const segment = ConnectionSegment.create(stickyIndex, connection);
    return segment.some ? OptionValue.some(ConnectionSegment.distanceFrom(segment.value, point)) : OptionValue.none();
  },
};
