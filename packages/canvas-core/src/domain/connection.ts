import type { Brand } from "./brand";
import type { StickyId } from "./sticky";

export type Anchor = "top" | "right" | "bottom" | "left";

/** 接続を文書内で一意に識別するID。 */
export type ConnectionId = Brand<string, "ConnectionId">;

/** 文字列から接続IDを生成する。 */
export const ConnectionId = {
  /**
   * 永続化された文字列を接続IDとして扱う。
   *
   * @param raw 接続IDとして扱う文字列。
   * @returns ブランド化された接続ID。
   */
  create: (raw: string): ConnectionId => raw as ConnectionId,
};

export interface Connection {
  readonly id: ConnectionId;
  readonly from: StickyId;
  readonly to: StickyId;
  readonly fromAnchor?: Anchor;
  readonly toAnchor?: Anchor;
  readonly label: string;
  readonly note: string;
}

export const Connection = {
  /**
   * 接続を生成する。
   *
   * @param id 接続ID。
   * @param from 始点の付箋ID。
   * @param to 終点の付箋ID。
   * @param label 接続のラベル。
   * @param note 接続内容のスナップショット。
   * @param fromAnchor 始点側のアンカー。
   * @param toAnchor 終点側のアンカー。
   * @returns 指定した値を持つ接続。
   */
  create: (
    id: ConnectionId,
    from: StickyId,
    to: StickyId,
    label: string,
    note: string,
    fromAnchor?: Anchor,
    toAnchor?: Anchor,
  ): Connection => ({ id, from, to, label, note, fromAnchor, toAnchor }),
};
