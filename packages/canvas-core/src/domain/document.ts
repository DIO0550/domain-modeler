import { Viewport } from "./viewport";
import { type Point, Size, StickyId, type Sticky, type StickyType } from "./sticky";
import {
  type Anchor,
  type Connection,
  ConnectionId,
} from "./connection";
import { CanvasError } from "./error";
import { Result } from "./result";

export interface Document {
  readonly version: string;
  readonly title: string;
  readonly viewport: Viewport;
  readonly stickies: readonly Sticky[];
  readonly connections: readonly Connection[];
}

export const DEFAULT_TITLE = "Untitled";

const STICKY_ID_PREFIX = "stk_";
const STICKY_RANDOM_PART_LENGTH = 12;
const CONNECTION_ID_PREFIX = "con_";
const CONNECTION_RANDOM_PART_LENGTH = 12;

const createStickyId = (): StickyId =>
  StickyId.create(
    `${STICKY_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, STICKY_RANDOM_PART_LENGTH)}`,
  );

const createConnectionId = (): ConnectionId =>
  ConnectionId.create(
    `${CONNECTION_ID_PREFIX}${crypto.randomUUID().replace(/-/g, "").slice(0, CONNECTION_RANDOM_PART_LENGTH)}`,
  );

export const Document = {
  empty: (title: string = DEFAULT_TITLE): Document => ({
    version: "1.0",
    title,
    viewport: Viewport.default(),
    stickies: [],
    connections: [],
  }),
  /** 付箋を追加する。 */
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
  updateStickyText: (doc: Document, stickyId: StickyId, text: string): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, text } : sticky,
    ),
  }),
  moveSticky: (doc: Document, stickyId: StickyId, position: Point): Document => ({
    ...doc,
    stickies: doc.stickies.map((sticky) =>
      sticky.id === stickyId ? { ...sticky, position } : sticky,
    ),
  }),
  /** 付箋のサイズを変更する。 */
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
  removeSticky: (doc: Document, stickyId: StickyId): Document => ({
    ...doc,
    stickies: doc.stickies.filter((sticky) => sticky.id !== stickyId),
    connections: doc.connections.filter(
      (connection) => connection.from !== stickyId && connection.to !== stickyId,
    ),
  }),
  /** 始点と終点を検証して接続を追加する。 */
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
  /** 接続のラベルを変更する。 */
  updateConnectionLabel: (
    doc: Document,
    connectionId: ConnectionId,
    label: string,
  ): Document => ({
    ...doc,
    connections: doc.connections.map((connection) =>
      connection.id === connectionId ? { ...connection, label } : connection,
    ),
  }),
  /** 接続のアンカーを指定する。省略したアンカーは自動配置に戻す。 */
  updateConnectionAnchors: (
    doc: Document,
    connectionId: ConnectionId,
    fromAnchor?: Anchor,
    toAnchor?: Anchor,
  ): Document => ({
    ...doc,
    connections: doc.connections.map((connection) =>
      connection.id === connectionId
        ? { ...connection, fromAnchor, toAnchor }
        : connection,
    ),
  }),
  /** 接続を削除する。 */
  removeConnection: (doc: Document, connectionId: ConnectionId): Document => ({
    ...doc,
    connections: doc.connections.filter(
      (connection) => connection.id !== connectionId,
    ),
  }),
};
