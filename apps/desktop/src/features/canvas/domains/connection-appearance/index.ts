import {
  type Connection,
  ConnectionSegment,
  ConnectionStatus,
  type Document,
  Document as DocumentValue,
  type Option,
  Option as OptionValue,
  type Point,
  type Sticky,
  Sticky as StickyValue,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../sticky-appearance";

/** 接続線のSVG形状。 */
export type ConnectionRoute =
  | Readonly<{ shape: "straight"; path: string; midpoint: Point }>
  | Readonly<{ shape: "curve"; path: string; midpoint: Point }>;

/** 接続ラベルの表示。空文字は描画しない。 */
export type ConnectionLabelAppearance =
  | Readonly<{ visibility: "hidden" }>
  | Readonly<{
      visibility: "visible";
      text: string;
      position: Point;
      width: number;
    }>;

/** core の解決結果から組み立てた接続線の表示。 */
export type ConnectionAppearance = Readonly<{
  route: ConnectionRoute;
  status: ConnectionStatus;
  label: ConnectionLabelAppearance;
  tooltip: string;
}>;

/** ほぼ水平・垂直とみなすワールド座標上のずれ。 */
const STRAIGHT_ALIGNMENT_TOLERANCE = 4;
/** ベジェ曲線が付箋の辺から離れる最小・最大距離。 */
const MINIMUM_CONTROL_DISTANCE = 40;
const MAXIMUM_CONTROL_DISTANCE = 140;

/**
 * SVG path の座標を安定した小数桁に丸める。
 *
 * @param value ワールド座標。
 * @returns 小数第3位までの座標。
 */
const svgCoordinate = (value: number): number =>
  Math.round(value * 1_000) / 1_000;

/**
 * 解決済み端点が付箋のどの辺にあるかを法線として返す。
 * アンカー自体は再計算せず、core が返した端点だけを使う。
 *
 * @param sticky 端点を持つ付箋。
 * @param endpoint core が解決した端点。
 * @returns 端点がある辺から外向きの単位法線。
 */
const outwardNormal = (sticky: Sticky, endpoint: Point): Point => {
  const center = StickyValue.center(sticky);
  const horizontalRatio =
    Math.abs(endpoint.x - center.x) / (sticky.size.width / 2);
  const verticalRatio =
    Math.abs(endpoint.y - center.y) / (sticky.size.height / 2);
  if (horizontalRatio >= verticalRatio) {
    return { x: endpoint.x < center.x ? -1 : 1, y: 0 };
  }
  return { x: 0, y: endpoint.y < center.y ? -1 : 1 };
};

/**
 * 2つの法線が向かい合い、端点をほぼ水平または垂直に結べるか判定する。
 *
 * @param segment core が解決した端点。
 * @param normals 始点と終点の外向き法線。
 * @returns 直線で結べる場合は true。
 */
const isStraightRoute = (
  segment: ConnectionSegment,
  normals: Readonly<{ from: Point; to: Point }>,
): boolean => {
  const delta = {
    x: segment.to.x - segment.from.x,
    y: segment.to.y - segment.from.y,
  };
  const facesHorizontally =
    normals.from.x === -normals.to.x &&
    normals.from.x * delta.x > 0 &&
    Math.abs(delta.y) <= STRAIGHT_ALIGNMENT_TOLERANCE;
  const facesVertically =
    normals.from.y === -normals.to.y &&
    normals.from.y * delta.y > 0 &&
    Math.abs(delta.x) <= STRAIGHT_ALIGNMENT_TOLERANCE;
  return facesHorizontally || facesVertically;
};

/**
 * 直線経路を組み立てる。
 *
 * @param segment core が解決した端点。
 * @returns SVGの直線経路と中点。
 */
const straightRoute = (segment: ConnectionSegment): ConnectionRoute => ({
  shape: "straight",
  path: `M ${svgCoordinate(segment.from.x)} ${svgCoordinate(segment.from.y)} L ${svgCoordinate(segment.to.x)} ${svgCoordinate(segment.to.y)}`,
  midpoint: {
    x: (segment.from.x + segment.to.x) / 2,
    y: (segment.from.y + segment.to.y) / 2,
  },
});

/**
 * 三次ベジェ経路を組み立てる。
 *
 * @param segment core が解決した端点。
 * @param normals 始点と終点の外向き法線。
 * @returns SVGの曲線経路と曲線上の中点。
 */
const curveRoute = (
  segment: ConnectionSegment,
  normals: Readonly<{ from: Point; to: Point }>,
): ConnectionRoute => {
  const endpointDistance = Math.hypot(
    segment.to.x - segment.from.x,
    segment.to.y - segment.from.y,
  );
  const controlDistance = Math.max(
    MINIMUM_CONTROL_DISTANCE,
    Math.min(MAXIMUM_CONTROL_DISTANCE, endpointDistance * 0.4),
  );
  const firstControl = {
    x: segment.from.x + normals.from.x * controlDistance,
    y: segment.from.y + normals.from.y * controlDistance,
  };
  const secondControl = {
    x: segment.to.x + normals.to.x * controlDistance,
    y: segment.to.y + normals.to.y * controlDistance,
  };
  const midpoint = {
    x:
      (segment.from.x +
        3 * firstControl.x +
        3 * secondControl.x +
        segment.to.x) /
      8,
    y:
      (segment.from.y +
        3 * firstControl.y +
        3 * secondControl.y +
        segment.to.y) /
      8,
  };
  return {
    shape: "curve",
    path: `M ${svgCoordinate(segment.from.x)} ${svgCoordinate(segment.from.y)} C ${svgCoordinate(firstControl.x)} ${svgCoordinate(firstControl.y)}, ${svgCoordinate(secondControl.x)} ${svgCoordinate(secondControl.y)}, ${svgCoordinate(segment.to.x)} ${svgCoordinate(segment.to.y)}`,
    midpoint,
  };
};

/**
 * ラベルのおおよその表示幅を返す。日本語等の全角文字は英数字より広く扱う。
 *
 * @param label 接続ラベル。
 * @returns 背景チップの幅。
 */
const labelWidth = (label: string): number =>
  Array.from(label).reduce(
    (width, character) =>
      width + (character.charCodeAt(0) <= 0x7f ? 7 : 13),
    16,
  );

/** core の解決結果から接続線の表示を作る関数群。 */
export const ConnectionAppearance = {
  /**
   * 文書内の接続から描画可能な表示を作る。
   *
   * @param document 接続元・接続先の付箋を含む文書。
   * @param connection 描画する接続。
   * @returns 描画表示。参照先が欠落して端点を解決できない場合は値なし。
   */
  create(
    document: Document,
    connection: Connection,
  ): Option<ConnectionAppearance> {
    const segment = ConnectionSegment.create(document, connection);
    const from = DocumentValue.stickyById(document, connection.from);
    const to = DocumentValue.stickyById(document, connection.to);
    if (!segment.some || !from.some || !to.some) {
      return OptionValue.none();
    }
    const normals = {
      from: outwardNormal(from.value, segment.value.from),
      to: outwardNormal(to.value, segment.value.to),
    };
    const route = isStraightRoute(segment.value, normals)
      ? straightRoute(segment.value)
      : curveRoute(segment.value, normals);
    const status = ConnectionStatus.between(from.value.type, to.value.type);
    const recommendedTargets = ConnectionStatus.recommendedTargets(
      from.value.type,
    )
      .map((type) => StickyAppearance.of(type).caption)
      .join(" / ");
    return OptionValue.some({
      route,
      status,
      label:
        connection.label.length === 0
          ? { visibility: "hidden" }
          : {
              visibility: "visible",
              text: connection.label,
              position: route.midpoint,
              width: labelWidth(connection.label),
            },
      tooltip:
        status === "ok"
          ? connection.label
          : `推奨ルール外の接続です。${StickyAppearance.of(from.value.type).caption} からの推奨接続先: ${recommendedTargets}`,
    });
  },
} as const;
