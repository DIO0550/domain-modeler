import type { Brand } from "./brand";
import type { Anchor, StickyId } from "./sticky";

export type { Anchor } from "./sticky";

/** 接続を文書内で一意に識別するID。 */
export type ConnectionId = Brand<string, "ConnectionId">;

/** 文字列から接続IDを生成する。 */
export const ConnectionId = {
  /**
   * 永続化された文字列を接続IDとして扱う。
   * @param raw 接続IDとして扱う文字列。
   * @returns 接続ID。
   */
  create: (raw: string): ConnectionId => raw as ConnectionId,
};

/** 2つの付箋間の接続。 */
export interface Connection {
  readonly id: ConnectionId;
  readonly from: StickyId;
  readonly to: StickyId;
  readonly fromAnchor?: Anchor;
  readonly toAnchor?: Anchor;
  readonly label: string;
  readonly note: string;
}

/** `Connection` を生成する関数群。 */
export const Connection = {
  /**
   * 指定された始点、終点、表示情報から接続を生成する。
   * @param id 接続ID。
   * @param from 始点の付箋ID。
   * @param to 終点の付箋ID。
   * @param label 接続に表示するラベル。
   * @param note 接続の注釈。
   * @param fromAnchor 始点側のアンカー。省略時は自動配置する。
   * @param toAnchor 終点側のアンカー。省略時は自動配置する。
   * @returns 指定内容で生成した接続。
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
