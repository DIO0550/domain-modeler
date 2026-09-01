import type { Point } from "../point";
import { Viewport } from "../viewport";
import { Size, Sticky, StickyId, type StickyType } from "../sticky";
import { StickyIndex } from "../sticky-index";
import {
  type Anchor,
  type Connection,
  ConnectionId,
} from "../connection";
import { CanvasError } from "../error";
import { ConnectionSegment } from "../connection-segment";
import { type Option, Option as OptionValue } from "../option";
import { Result } from "../result";

/** キャンバスの付箋、接続、表示範囲を保持する文書。 */
export interface Document {
  readonly version: string;
  readonly title: string;
  readonly viewport: Viewport;
  readonly stickies: readonly Sticky[];
  readonly connections: readonly Connection[];
}

/** タイトルが指定されない文書に使用する名称。 */
export const DEFAULT_TITLE = "Untitled";

const STICKY_ID_PREFIX = "stk_";
const STICKY_RANDOM_PART_LENGTH = 12;
const CONNECTION_ID_PREFIX = "con_";
const CONNECTION_RANDOM_PART_LENGTH = 12;

/**
 * ランダムな付箋IDを生成する。
 * @returns 生成した付箋ID。
 */
const createStickyId = (): StickyId =>
  StickyId.create(
    `${STICKY_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, STICKY_RANDOM_PART_LENGTH)}`,
  );

/**
 * ランダムな接続IDを生成する。
 * @returns 生成した接続ID。
 */
const createConnectionId = (): ConnectionId =>
  ConnectionId.create(
    `${CONNECTION_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, CONNECTION_RANDOM_PART_LENGTH)}`,
  );

/** `Document` を生成、更新する関数群。 */
export const Document = {
  /**
   * 付箋と接続を持たない文書を生成する。
   * @param title 文書タイトル。
   * @returns デフォルトの表示範囲を持つ空の文書。
   */
  empty: (title: string = DEFAULT_TITLE): Document => ({
    version: "1.0",
    title,
    viewport: Viewport.default(),
    stickies: [],
    connections: [],
  }),
  /**
   * 指定座標にある最前面の付箋を取得する。
   * @param doc 判定対象の文書。
   * @param point 判定するワールド座標。
   * @returns 座標にある最前面の付箋。該当する付箋がなければ値なし。
   */
  stickyAt: (doc: Document, point: Point): Option<Sticky> =>
    doc.stickies.reduceRight<Option<Sticky>>(
      (hit, sticky) =>
        hit.some || !Sticky.contains(sticky, point)
          ? hit
          : OptionValue.some(sticky),
      OptionValue.none(),
    ),
  /**
   * 指定した ID の付箋を取得する。
   * @param doc 検索対象の文書。
   * @param stickyId 探す付箋の ID。
   * @returns 一致した付箋。該当する付箋がなければ値なし。
   */
  stickyById: (doc: Document, stickyId: StickyId): Option<Sticky> => {
    const found = doc.stickies.find((sticky) => sticky.id === stickyId);
    return found === undefined
      ? OptionValue.none()
      : OptionValue.some(found);
  },
  /**
   * 指定座標にある最後に追加された接続を取得する。
   * @param doc 判定対象の文書。
   * @param point 判定するワールド座標。
   * @param tolerance ワールド座標系の許容距離。画面上の許容距離をズーム倍率で割った値を渡す。
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
   * 指定した ID の接続を取得する。
   * @param doc 検索対象の文書。
   * @param connectionId 探す接続の ID。
   * @returns 一致した接続。該当する接続がなければ値なし。
   */
  connectionById: (
    doc: Document,
    connectionId: ConnectionId,
  ): Option<Connection> => {
    const found = doc.connections.find(
      (connection) => connection.id === connectionId,
    );
    return found === undefined
      ? OptionValue.none()
      : OptionValue.some(found);
  },
  /**
   * 付箋を追加する。
   * @param doc 付箋を追加する文書。
   * @param type 追加する付箋の種別。
   * @param text 追加する付箋の本文。
   * @param position 追加する付箋の位置。
   * @param size 追加する付箋のサイズ。
   * @returns 付箋を追加した文書。サイズが不正な場合はエラー。
   */
  addSticky: (
    doc: Document,
    type: StickyType,
    text: string,
    position: Point,
    size: Size,
  ): Result<Document> => {
    if (!Size.isValid(size)) {
      return Result.err(
        CanvasError.create("INVALID_STICKY_SIZE", "Sticky size must be positive"),
      );
    }

    const sticky: Sticky = {
      id: createStickyId(),
      type,
      text,
      position,
      size,
    };

    return Result.ok({
      ...doc,
      stickies: [...doc.stickies, sticky],
    });
  },
  /**
   * 付箋の本文を変更する。
   * @param doc 変更対象の文書。
   * @param stickyId 変更する付箋のID。
   * @param text 変更後の本文。
   * @returns 付箋の本文を変更した文書。
   */
  updateStickyText: (doc: Document, stickyId: StickyId, text: string): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, text } : sticky,
    ),
  }),
  /**
   * 付箋を移動する。
   * @param doc 変更対象の文書。
   * @param stickyId 移動する付箋のID。
   * @param position 移動後の位置。
   * @returns 付箋を移動した文書。
   */
  moveSticky: (doc: Document, stickyId: StickyId, position: Point): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, position } : sticky,
    ),
  }),
  /**
   * 付箋のサイズを変更する。
   * @param doc 変更対象の文書。
   * @param stickyId サイズを変更する付箋のID。
   * @param size 変更後のサイズ。
   * @returns サイズを変更した文書。サイズが不正な場合はエラー。
   */
  resizeSticky: (
    doc: Document,
    stickyId: StickyId,
    size: Size,
  ): Result<Document> => {
    if (!Size.isValid(size)) {
      return Result.err(
        CanvasError.create("INVALID_STICKY_SIZE", "Sticky size must be positive"),
      );
    }

    return Result.ok({
      ...doc,
      stickies: doc.stickies.map((sticky) =>
        sticky.id === stickyId ? { ...sticky, size } : sticky,
      ),
    });
  },
  /**
   * 付箋の種別を変更する。
   * @param doc 変更対象の文書。
   * @param stickyId 種別を変更する付箋のID。
   * @param type 変更後の付箋種別。
   * @returns 付箋の種別を変更した文書。
   */
  changeStickyType: (
    doc: Document,
    stickyId: StickyId,
    type: StickyType,
  ): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, type } : sticky,
    ),
  }),
  /**
   * 付箋を最前面へ移動する。
   * @param doc 変更対象の文書。
   * @param stickyId 最前面へ移動する付箋のID。
   * @returns 付箋の重なり順を変更した文書。
   */
  bringStickyToFront: (doc: Document, stickyId: StickyId): Document => {
    const index = doc.stickies.findIndex((sticky) => sticky.id === stickyId);
    if (index < 0 || index === doc.stickies.length - 1) {
      return doc;
    }

    const sticky = doc.stickies[index];
    return {
      ...doc,
      stickies: [
        ...doc.stickies.slice(0, index),
        ...doc.stickies.slice(index + 1),
        sticky,
      ],
    };
  },
  /**
   * 付箋とその付箋に関連する接続を削除する。
   * @param doc 変更対象の文書。
   * @param stickyId 削除する付箋のID。
   * @returns 付箋と関連する接続を削除した文書。
   */
  removeSticky: (doc: Document, stickyId: StickyId): Document => ({
    ...doc,
    stickies: doc.stickies.filter((sticky) => sticky.id !== stickyId),
    connections: doc.connections.filter(
      (connection) => connection.from !== stickyId && connection.to !== stickyId,
    ),
  }),
  /**
   * 始点と終点を検証して接続を追加する。
   * @param doc 接続を追加する文書。
   * @param from 始点の付箋ID。
   * @param to 終点の付箋ID。
   * @param label 接続に表示するラベル。
   * @returns 接続を追加した文書。接続できない場合はエラー。
   */
  addConnection: (
    doc: Document,
    from: StickyId,
    to: StickyId,
    label = "",
  ): Result<Document> => {
    if (from === to) {
      return Result.err(
        CanvasError.create(
          "SELF_REFERENTIAL_CONNECTION",
          "A sticky cannot connect to itself",
        ),
      );
    }
    if (!doc.stickies.some((sticky) => sticky.id === from)) {
      return Result.err(
        CanvasError.create(
          "CONNECTION_SOURCE_NOT_FOUND",
          `Connection source sticky does not exist: ${from}`,
        ),
      );
    }
    if (!doc.stickies.some((sticky) => sticky.id === to)) {
      return Result.err(
        CanvasError.create(
          "CONNECTION_TARGET_NOT_FOUND",
          `Connection target sticky does not exist: ${to}`,
        ),
      );
    }

    const connection: Connection = {
      id: createConnectionId(),
      from,
      to,
      label,
      note: "",
    };

    return Result.ok({
      ...doc,
      connections: [...doc.connections, connection],
    });
  },
  /**
   * 接続のラベルを変更する。
   * @param doc 変更対象の文書。
   * @param connectionId 変更する接続のID。
   * @param label 変更後のラベル。
   * @returns 接続のラベルを変更した文書。接続が存在しない場合は入力文書。
   */
  updateConnectionLabel: (
    doc: Document,
    connectionId: ConnectionId,
    label: string,
  ): Document => {
    const index = doc.connections.findIndex(
      (connection) => connection.id === connectionId,
    );
    if (index < 0) {
      return doc;
    }

    return {
      ...doc,
      connections: [
        ...doc.connections.slice(0, index),
        { ...doc.connections[index], label },
        ...doc.connections.slice(index + 1),
      ],
    };
  },
  /**
   * 接続のアンカーを指定する。省略したアンカーは自動配置に戻す。
   * @param doc 変更対象の文書。
   * @param connectionId 変更する接続のID。
   * @param fromAnchor 始点側のアンカー。
   * @param toAnchor 終点側のアンカー。
   * @returns 接続のアンカーを変更した文書。接続が存在しない場合は入力文書。
   */
  updateConnectionAnchors: (
    doc: Document,
    connectionId: ConnectionId,
    fromAnchor?: Anchor,
    toAnchor?: Anchor,
  ): Document => {
    const index = doc.connections.findIndex(
      (connection) => connection.id === connectionId,
    );
    if (index < 0) {
      return doc;
    }

    return {
      ...doc,
      connections: [
        ...doc.connections.slice(0, index),
        { ...doc.connections[index], fromAnchor, toAnchor },
        ...doc.connections.slice(index + 1),
      ],
    };
  },
  /**
   * 接続を削除する。
   * @param doc 変更対象の文書。
   * @param connectionId 削除する接続のID。
   * @returns 接続を削除した文書。接続が存在しない場合は入力文書。
   */
  removeConnection: (doc: Document, connectionId: ConnectionId): Document => {
    const index = doc.connections.findIndex(
      (connection) => connection.id === connectionId,
    );
    if (index < 0) {
      return doc;
    }

    return {
      ...doc,
      connections: [
        ...doc.connections.slice(0, index),
        ...doc.connections.slice(index + 1),
      ],
    };
  },
};
