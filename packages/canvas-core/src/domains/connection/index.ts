import type { Brand } from "../brand";
import type { Anchor, StickyId } from "../sticky";

export type { Anchor } from "../sticky";

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

/** note 派生時に各付箋テキストから採用する最大文字数（UTF-16 コードユニット）。 */
const NOTE_TEXT_MAX_LENGTH = 20;

/**
 * 付箋テキストを note 用に正規化する（改行スペース化 → 先頭切り詰め）。
 * @param text 付箋の生テキスト。
 * @returns note に埋め込む断片。
 */
const normalizeNoteFragment = (text: string): string =>
  text.replace(/\r\n|\r|\n/g, " ").slice(0, NOTE_TEXT_MAX_LENGTH);

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

  /**
   * 始点・終点付箋テキストから接続の note を派生する。
   * 各テキストは改行をスペースに置換し先頭20文字に切り詰めたうえで
   * `<始点> -> <終点>` 形式で結合する。
   * @param fromText 始点付箋のテキスト（欠落時は呼び出し側が "" を渡す）。
   * @param toText 終点付箋のテキスト（欠落時は呼び出し側が "" を渡す）。
   * @returns 派生した note 文字列。
   */
  buildNote: (fromText: string, toText: string): string =>
    `${normalizeNoteFragment(fromText)} -> ${normalizeNoteFragment(toText)}`,
} as const;
