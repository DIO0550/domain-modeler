import { ConnectionSegment } from "@domain-modeler/canvas-core";
import type {
  Anchor,
  Point,
  ConnectionId,
  StickyId,
} from "@domain-modeler/canvas-core";

/** 接続の作成、選択、ラベル編集の状態。 */
export type ConnectionSession =
  | Readonly<{ status: "idle" }>
  | Readonly<{
      status: "dragging";
      sourceId: StickyId;
      anchor: Anchor;
      origin: Point;
      point: Point;
    }>
  | Readonly<{ status: "selectingSource" }>
  | Readonly<{ status: "selectingTarget"; sourceId: StickyId }>
  | Readonly<{ status: "selected"; connectionId: ConnectionId }>
  | Readonly<{
      status: "editing";
      connectionId: ConnectionId;
      draftLabel: string;
      originalLabel: string;
    }>;

/** 接続セッションの状態を問い合わせる関数群。 */
export const ConnectionSession = {
  /** 操作した辺の外側へ出てからポインターへ向かうプレビュー経路。 */
  previewPath(
    session: Extract<ConnectionSession, { status: "dragging" }>,
  ): string {
    const normals: Readonly<Record<Anchor, Point>> = {
      top: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      bottom: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
    };
    return ConnectionSegment.toRoute({
      from: session.origin,
      to: session.point,
      fromOutwardNormal: normals[session.anchor],
      toOutwardNormal: { x: 0, y: 0 },
    }).path;
  },
  /**
   * 始点または終点を選択中か判定する。
   *
   * @param session 接続セッション。
   * @returns 接続の端点を選択中なら true。
   */
  isCreating(session: ConnectionSession): boolean {
    return (
      session.status === "dragging" ||
      session.status === "selectingSource" ||
      session.status === "selectingTarget"
    );
  },

  /**
   * 指定した接続の表示状態を返す。
   *
   * @param session 接続セッション。
   * @param connectionId 表示する接続 ID。
   * @returns 通常、選択中、ラベル編集中のいずれか。
   */
  statusOf(
    session: ConnectionSession,
    connectionId: ConnectionId,
  ): "plain" | "selected" | "editing" {
    if (
      session.status === "idle" ||
      session.status === "dragging" ||
      session.status === "selectingSource" ||
      session.status === "selectingTarget"
    ) {
      return "plain";
    }
    if (session.connectionId !== connectionId) {
      return "plain";
    }
    return session.status;
  },

  /**
   * 指定した付箋が接続作成中の始点か判定する。
   *
   * @param session 接続セッション。
   * @param stickyId 判定する付箋 ID。
   * @returns 選択済みの始点なら true。
   */
  isSource(session: ConnectionSession, stickyId: StickyId): boolean {
    return (
      (session.status === "selectingTarget" || session.status === "dragging") &&
      session.sourceId === stickyId
    );
  },
} as const;
