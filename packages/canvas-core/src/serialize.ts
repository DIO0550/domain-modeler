import type { Document } from "./domain/document";
import {
  Anchor,
  Size,
  StickyId,
  StickyType,
  type Sticky,
} from "./domain/sticky";
import { Connection, ConnectionId } from "./domain/connection";
import { Viewport } from "./domain/viewport";
import { CanvasError } from "./domain/error";
import { Result } from "./domain/result";
import { NumberEx } from "./utils/NumberEx";

/** アプリが対応するスキーマの major バージョン。 */
const SUPPORTED_MAJOR = 1;

/** 書き出し時に用いるアプリ対応の最新スキーマバージョン。 */
const DOCUMENT_WRITE_VERSION = "1.0";

/** `version` フィールドの `<major>.<minor>` 形式。 */
const VERSION_PATTERN = /^(\d+)\.(\d+)$/;

/**
 * 値がプレーンオブジェクトか判定する。
 * @param value 判定する値。
 * @returns プレーンオブジェクトの場合は `true`。
 */
const isPlainObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * JSON 文字列をパースする。失敗時は INVALID_JSON を返す。
 * @param json パースする JSON 文字列。
 * @returns パース結果。
 */
const parseJson = (json: string): Result<unknown> => {
  try {
    return Result.ok(JSON.parse(json) as unknown);
  } catch {
    return Result.err(
      CanvasError.create("INVALID_JSON", "JSON could not be parsed"),
    );
  }
};

/**
 * version 文字列を検証し、対応 major と一致するか確認する。
 * @param version 検証する version 文字列。
 * @returns 成功時は元の version 文字列。
 */
const parseVersion = (version: unknown): Result<string> => {
  if (typeof version !== "string") {
    return Result.err(
      CanvasError.create(
        "INVALID_VERSION",
        "version must be a string in <major>.<minor> format",
      ),
    );
  }

  const matched = VERSION_PATTERN.exec(version);
  if (matched === null) {
    return Result.err(
      CanvasError.create(
        "INVALID_VERSION",
        `version must be in <major>.<minor> format: ${version}`,
      ),
    );
  }

  const major = Number(matched[1]);
  if (major !== SUPPORTED_MAJOR) {
    return Result.err(
      CanvasError.create(
        "VERSION_MAJOR_MISMATCH",
        `Unsupported version major ${major}; expected ${SUPPORTED_MAJOR}`,
      ),
    );
  }

  return Result.ok(version);
};

/**
 * viewport を検証し、zoom をクランプする。
 * @param viewport 検証する viewport 値。
 * @returns 検証済みの Viewport。
 */
const parseViewport = (viewport: unknown): Result<Viewport> => {
  if (!isPlainObject(viewport)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "viewport must be an object"),
    );
  }
  if (
    !NumberEx.isFinite(viewport.x) ||
    !NumberEx.isFinite(viewport.y) ||
    !NumberEx.isFinite(viewport.zoom)
  ) {
    return Result.err(
      CanvasError.create(
        "INVALID_DOCUMENT",
        "viewport.x, viewport.y, and viewport.zoom must be finite numbers",
      ),
    );
  }

  return Result.ok({
    x: viewport.x,
    y: viewport.y,
    zoom: Viewport.clampZoom(viewport.zoom),
  });
};

/**
 * 任意のアンカー値を Option 相当で検証する。
 * @param value アンカー候補。
 * @param fieldName エラーメッセージ用のフィールド名。
 * @returns 省略時は成功(undefined)、不正値はエラー。
 */
const parseOptionalAnchor = (
  value: unknown,
  fieldName: string,
): Result<Anchor | undefined> => {
  if (value === undefined) {
    return Result.ok(undefined);
  }
  if (!Anchor.is(value)) {
    return Result.err(
      CanvasError.create(
        "INVALID_ANCHOR",
        `${fieldName} must be top, right, bottom, or left`,
      ),
    );
  }
  return Result.ok(value);
};

/**
 * 付箋1件を検証して Sticky へ変換する。
 * @param value 検証する付箋候補。
 * @returns 検証済みの Sticky。
 */
const parseSticky = (value: unknown): Result<Sticky> => {
  if (!isPlainObject(value)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "sticky must be an object"),
    );
  }
  if (typeof value.id !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "sticky.id must be a string"),
    );
  }
  if (!StickyType.is(value.type)) {
    return Result.err(
      CanvasError.create(
        "INVALID_STICKY_TYPE",
        `Unknown sticky type: ${String(value.type)}`,
      ),
    );
  }
  if (typeof value.text !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "sticky.text must be a string"),
    );
  }
  if (!isPlainObject(value.position)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "sticky.position must be an object"),
    );
  }
  if (
    !NumberEx.isFinite(value.position.x) ||
    !NumberEx.isFinite(value.position.y)
  ) {
    return Result.err(
      CanvasError.create(
        "INVALID_DOCUMENT",
        "sticky.position.x and sticky.position.y must be finite numbers",
      ),
    );
  }
  if (!isPlainObject(value.size)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "sticky.size must be an object"),
    );
  }
  if (
    !NumberEx.isFinite(value.size.width) ||
    !NumberEx.isFinite(value.size.height)
  ) {
    return Result.err(
      CanvasError.create(
        "INVALID_DOCUMENT",
        "sticky.size.width and sticky.size.height must be finite numbers",
      ),
    );
  }

  const size = { width: value.size.width, height: value.size.height };
  if (!Size.isValid(size)) {
    return Result.err(
      CanvasError.create("INVALID_STICKY_SIZE", "Sticky size must be positive"),
    );
  }

  return Result.ok({
    id: StickyId.create(value.id),
    type: value.type,
    text: value.text,
    position: { x: value.position.x, y: value.position.y },
    size,
  });
};

/**
 * 付箋配列を検証する。ID 一意性も確認する。
 * @param stickies 検証する配列。
 * @returns 検証済みの Sticky 配列。
 */
const parseStickies = (stickies: unknown): Result<readonly Sticky[]> => {
  if (!Array.isArray(stickies)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "stickies must be an array"),
    );
  }

  const parsed: Sticky[] = [];
  const seenIds = new Set<string>();

  for (const stickyValue of stickies) {
    const stickyResult = parseSticky(stickyValue);
    if (!stickyResult.ok) {
      return stickyResult;
    }

    const sticky = stickyResult.value;
    if (seenIds.has(sticky.id)) {
      return Result.err(
        CanvasError.create(
          "DUPLICATE_STICKY_ID",
          `Duplicate sticky id: ${sticky.id}`,
        ),
      );
    }
    seenIds.add(sticky.id);
    parsed.push(sticky);
  }

  return Result.ok(parsed);
};

/**
 * 接続1件を検証して Connection へ変換する。note は無視する。
 * @param value 検証する接続候補。
 * @param stickyIds 参照整合性確認用の付箋 ID 集合。
 * @returns 検証済みの Connection。
 */
const parseConnection = (
  value: unknown,
  stickyIds: ReadonlySet<string>,
): Result<Connection> => {
  if (!isPlainObject(value)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connection must be an object"),
    );
  }
  if (typeof value.id !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connection.id must be a string"),
    );
  }
  if (typeof value.from !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connection.from must be a string"),
    );
  }
  if (typeof value.to !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connection.to must be a string"),
    );
  }
  if (typeof value.label !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connection.label must be a string"),
    );
  }

  if (value.from === value.to) {
    return Result.err(
      CanvasError.create(
        "SELF_REFERENTIAL_CONNECTION",
        "A sticky cannot connect to itself",
      ),
    );
  }
  if (!stickyIds.has(value.from)) {
    return Result.err(
      CanvasError.create(
        "CONNECTION_SOURCE_NOT_FOUND",
        `Connection source sticky does not exist: ${value.from}`,
      ),
    );
  }
  if (!stickyIds.has(value.to)) {
    return Result.err(
      CanvasError.create(
        "CONNECTION_TARGET_NOT_FOUND",
        `Connection target sticky does not exist: ${value.to}`,
      ),
    );
  }

  const fromAnchorResult = parseOptionalAnchor(value.fromAnchor, "fromAnchor");
  if (!fromAnchorResult.ok) {
    return fromAnchorResult;
  }
  const toAnchorResult = parseOptionalAnchor(value.toAnchor, "toAnchor");
  if (!toAnchorResult.ok) {
    return toAnchorResult;
  }

  return Result.ok(
    Connection.create(
      ConnectionId.create(value.id),
      StickyId.create(value.from),
      StickyId.create(value.to),
      value.label,
      "",
      fromAnchorResult.value,
      toAnchorResult.value,
    ),
  );
};

/**
 * 接続配列を検証する。ID 一意性と参照整合性も確認する。
 * @param connections 検証する配列。
 * @param stickies 参照先となる付箋配列。
 * @returns 検証済みの Connection 配列。
 */
const parseConnections = (
  connections: unknown,
  stickies: readonly Sticky[],
): Result<readonly Connection[]> => {
  if (!Array.isArray(connections)) {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "connections must be an array"),
    );
  }

  const stickyIds = new Set(stickies.map((sticky) => sticky.id));
  const parsed: Connection[] = [];
  const seenIds = new Set<string>();

  for (const connectionValue of connections) {
    const connectionResult = parseConnection(connectionValue, stickyIds);
    if (!connectionResult.ok) {
      return connectionResult;
    }

    const connection = connectionResult.value;
    if (seenIds.has(connection.id)) {
      return Result.err(
        CanvasError.create(
          "DUPLICATE_CONNECTION_ID",
          `Duplicate connection id: ${connection.id}`,
        ),
      );
    }
    seenIds.add(connection.id);
    parsed.push(connection);
  }

  return Result.ok(parsed);
};

/**
 * パース済みオブジェクトを Document へ変換する。
 * @param raw トップレベルの JSON オブジェクト。
 * @returns 検証済みの Document。
 */
const parseDocumentObject = (raw: Record<string, unknown>): Result<Document> => {
  const versionResult = parseVersion(raw.version);
  if (!versionResult.ok) {
    return versionResult;
  }
  if (typeof raw.title !== "string") {
    return Result.err(
      CanvasError.create("INVALID_DOCUMENT", "title must be a string"),
    );
  }

  const viewportResult = parseViewport(raw.viewport);
  if (!viewportResult.ok) {
    return viewportResult;
  }

  const stickiesResult = parseStickies(raw.stickies);
  if (!stickiesResult.ok) {
    return stickiesResult;
  }

  const connectionsResult = parseConnections(
    raw.connections,
    stickiesResult.value,
  );
  if (!connectionsResult.ok) {
    return connectionsResult;
  }

  return Result.ok({
    version: versionResult.value,
    title: raw.title,
    viewport: viewportResult.value,
    stickies: stickiesResult.value,
    connections: connectionsResult.value,
  });
};

/**
 * sticky ID に対応するテキストを返す。見つからなければ空文字。
 * @param stickies 付箋配列。
 * @param id 検索する sticky ID。
 * @returns 付箋テキスト。欠落時は空文字。
 */
const stickyTextById = (stickies: readonly Sticky[], id: string): string =>
  stickies.find((sticky) => sticky.id === id)?.text ?? "";

/**
 * Viewport を表順のプレーンオブジェクトにする。
 * @param viewport 変換する Viewport。
 * @returns キー順固定の Viewport。
 */
const toViewportPlain = (viewport: Viewport): Viewport => ({
  x: viewport.x,
  y: viewport.y,
  zoom: viewport.zoom,
});

/**
 * Sticky を表順のプレーンオブジェクトにする。
 * @param sticky 変換する Sticky。
 * @returns キー順固定の Sticky。
 */
const toStickyPlain = (sticky: Sticky): Sticky => ({
  id: sticky.id,
  type: sticky.type,
  text: sticky.text,
  position: { x: sticky.position.x, y: sticky.position.y },
  size: { width: sticky.size.width, height: sticky.size.height },
});

/**
 * Connection を表順のプレーンオブジェクトにする。
 * note を再生成する。省略アンカーは undefined とし、JSON 化時にキー自体を出さない。
 * @param connection 変換する Connection。
 * @param stickies note 派生用の付箋配列。
 * @returns キー順固定の Connection。
 */
const toConnectionPlain = (
  connection: Connection,
  stickies: readonly Sticky[],
): Connection => ({
  id: connection.id,
  from: connection.from,
  to: connection.to,
  fromAnchor: connection.fromAnchor,
  toAnchor: connection.toAnchor,
  label: connection.label,
  note: Connection.buildNote(
    stickyTextById(stickies, connection.from),
    stickyTextById(stickies, connection.to),
  ),
});

/**
 * Document をキー順固定のプレーンオブジェクトにする。
 * @param document 変換する Document。
 * @returns キー順固定の Document。
 */
const toDocumentPlain = (document: Document): Document => ({
  version: DOCUMENT_WRITE_VERSION,
  title: document.title,
  viewport: toViewportPlain(document.viewport),
  stickies: document.stickies.map(toStickyPlain),
  connections: document.connections.map((connection) =>
    toConnectionPlain(connection, document.stickies),
  ),
});

/** `.dcanvas` JSON と Document を相互変換する関数群。 */
export const Serialize = {
  /**
   * JSON 文字列を検証して Document へ変換する。
   * 未知のトップレベルフィールドと接続の note は無視する。
   * viewport.zoom は有効範囲へクランプする。
   * @param json `.dcanvas` 形式の JSON 文字列。
   * @returns 検証に成功した Document。違反がある場合は種別付きエラー。
   */
  parse: (json: string): Result<Document> => {
    const jsonResult = parseJson(json);
    if (!jsonResult.ok) {
      return jsonResult;
    }
    if (!isPlainObject(jsonResult.value)) {
      return Result.err(
        CanvasError.create("INVALID_DOCUMENT", "document must be an object"),
      );
    }

    return parseDocumentObject(jsonResult.value);
  },

  /**
   * Document を `.dcanvas` JSON 文字列へ書き出す。
   * 接続の note を sticky テキストから再生成し、インデント2・キー順固定で整形する。
   * version はアプリ対応の最新（"1.0"）で書き出す。
   * @param document 検証済みの Document。
   * @returns 整形済み JSON 文字列。
   */
  stringify: (document: Document): string =>
    JSON.stringify(toDocumentPlain(document), null, 2),
} as const;
