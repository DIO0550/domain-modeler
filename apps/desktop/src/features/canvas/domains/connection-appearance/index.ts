import {
  type Connection,
  ConnectionSegment,
  ConnectionStatus,
  type Option,
  Option as OptionValue,
  type StickyIndex,
  StickyIndex as StickyIndexValue,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../sticky-appearance";

/** 接続線のSVG形状。 */
type ConnectionRoute = ReturnType<typeof ConnectionSegment.toRoute>;

/** 接続ラベルの表示。空文字は描画しない。 */
type ConnectionLabelAppearance =
  | Readonly<{ visibility: "hidden" }>
  | Readonly<{
      visibility: "visible";
      text: string;
      position: ConnectionRoute["midpoint"];
    }>;

/** core の解決結果から組み立てた接続線の表示。 */
export type ConnectionAppearance = Readonly<{
  route: ConnectionRoute;
  endpoints: Readonly<{
    from: ConnectionSegment["from"];
    to: ConnectionSegment["to"];
  }>;
  status: ConnectionStatus;
  label: ConnectionLabelAppearance;
  tooltip: string;
}>;

/** core の解決結果から接続線の表示を作る関数群。 */
export const ConnectionAppearance = {
  /**
   * 文書内の接続から描画可能な表示を作る。
   *
   * @param stickyIndex 接続元・接続先の付箋を含む索引。
   * @param connection 描画する接続。
   * @returns 描画表示。参照先が欠落して端点を解決できない場合は値なし。
   */
  create(
    stickyIndex: StickyIndex,
    connection: Connection,
  ): Option<ConnectionAppearance> {
    const segment = ConnectionSegment.create(stickyIndex, connection);
    const from = StickyIndexValue.get(stickyIndex, connection.from);
    const to = StickyIndexValue.get(stickyIndex, connection.to);
    if (!segment.some || !from.some || !to.some) {
      return OptionValue.none();
    }
    const route = ConnectionSegment.toRoute(segment.value);
    const status = ConnectionStatus.between(from.value.type, to.value.type);
    const recommendedTargets = ConnectionStatus.recommendedTargets(
      from.value.type,
    )
      .map((type) => StickyAppearance.of(type).caption)
      .join(" / ");
    return OptionValue.some({
      route,
      endpoints: { from: segment.value.from, to: segment.value.to },
      status,
      label:
        connection.label.length === 0
          ? { visibility: "hidden" }
          : {
              visibility: "visible",
              text: connection.label,
              position: route.midpoint,
            },
      tooltip:
        status === "ok"
          ? connection.label
          : `推奨ルール外の接続です。${StickyAppearance.of(from.value.type).caption} からの推奨接続先: ${recommendedTargets}`,
    });
  },
} as const;
