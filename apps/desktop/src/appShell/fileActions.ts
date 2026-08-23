import {
  Document,
  Serialize,
  type CanvasError,
} from "@domain-modeler/canvas-core";
import type { TabDocumentType } from "./tabs";

/** ファイル書き込みに失敗した理由。 */
export type FileWriteError = Readonly<{
  kind: "writeFailed";
  path: string;
  message: string;
}>;

/** ファイル書き込み IPC の結果。 */
export type FileWriteResult =
  | Readonly<{ type: "ok" }>
  | Readonly<{ type: "err"; error: FileWriteError }>;

/**
 * ファイル書き込みの例外を失敗結果へ変換する。
 *
 * @param writeFile 対象パスへ内容を書く操作。
 * @param target 書き込み先パスと内容。
 * @returns 成功または書き込み失敗。
 */
export const writeFileAsResult = async (
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>,
  target: Readonly<{ path: string; contents: string }>,
): Promise<FileWriteResult> => {
  try {
    return await writeFile(target.path, target.contents);
  } catch (caught) {
    return {
      type: "err",
      error: {
        kind: "writeFailed",
        path: target.path,
        message: writeFailureMessage(caught),
      },
    };
  }
};

/**
 * 書き込み例外から失敗メッセージを取り出す。
 *
 * @param caught 捕捉した例外。
 * @returns 表示用の失敗メッセージ。
 */
const writeFailureMessage = (caught: unknown): string => {
  if (caught instanceof Error) {
    return caught.message;
  }
  return String(caught);
};

/** ファイル読み込みに失敗した理由。 */
export type FileReadError =
  | Readonly<{ kind: "notFound"; path: string }>
  | Readonly<{ kind: "invalidUtf8"; path: string }>
  | Readonly<{ kind: "readFailed"; path: string; message: string }>;

/** ファイル読み込み IPC の結果。 */
export type FileReadResult =
  | Readonly<{ type: "ok"; value: string }>
  | Readonly<{ type: "err"; error: FileReadError }>;

/** 新規作成フローが利用する外部操作。 */
export type NewDocumentOperations = Readonly<{
  selectSavePath: (
    documentType: TabDocumentType,
  ) => Promise<SavePathSelection>;
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>;
  openTab: (path: string, documentType: TabDocumentType) => void;
}>;

/** ファイルを開くフローが利用する外部操作。 */
export type OpenDocumentOperations = Readonly<{
  readFile: (path: string) => Promise<FileReadResult>;
  openTab: (path: string, documentType: TabDocumentType) => void;
  notifyError: (error: OpenDocumentError) => void;
}>;

/** 保存ダイアログでの保存先選択結果。 */
export type SavePathSelection =
  | Readonly<{ status: "selected"; path: string }>
  | Readonly<{ status: "cancelled" }>;

/** 新規作成フローの完了状態。 */
export type NewDocumentResult =
  | Readonly<{ status: "created"; path: string }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "writeFailed"; error: FileWriteError }>;

/** ファイルを開けなかった理由。 */
export type OpenDocumentError =
  | Readonly<{ kind: "unsupportedExtension"; path: string }>
  | Readonly<{ kind: "readFailed"; error: FileReadError }>
  | Readonly<{ kind: "invalidCanvas"; path: string; error: CanvasError }>;

/** ファイルを開くフローの完了状態。 */
export type OpenDocumentResult =
  | Readonly<{
      status: "opened";
      path: string;
      documentType: TabDocumentType;
    }>
  | Readonly<{ status: "rejected"; error: OpenDocumentError }>;

/** ファイルの新規作成・オープンフローを扱う関数群。 */
export const FileActions = {
  /**
   * 保存先を選択し、初期内容の書き込み成功後にタブを開く。
   *
   * @param documentType 作成する文書の種別。
   * @param operations 保存先選択、書き込み、タブ追加を行う外部操作。
   * @returns 作成、キャンセル、または書き込み失敗の結果。
   */
  async createNewDocument(
    documentType: TabDocumentType,
    operations: NewDocumentOperations,
  ): Promise<NewDocumentResult> {
    const selection = await operations.selectSavePath(documentType);
    if (selection.status === "cancelled") {
      return { status: "cancelled" };
    }

    const writeResult = await operations.writeFile(
      selection.path,
      initialContents(documentType),
    );
    if (writeResult.type === "err") {
      return { status: "writeFailed", error: writeResult.error };
    }

    operations.openTab(selection.path, documentType);
    return { status: "created", path: selection.path };
  },

  /**
   * パスの拡張子を確認して内容を読み込み、検証成功後にタブを開く。
   * メニュー、ドラッグ&ドロップ、OS 関連付けの各入口で共通利用する。
   *
   * @param path 開くファイルのパス。
   * @param operations 読み込み、タブ追加、エラー通知を行う外部操作。
   * @returns オープン成功、または拒否理由。
   */
  async openDocument(
    path: string,
    operations: OpenDocumentOperations,
  ): Promise<OpenDocumentResult> {
    const documentType = documentTypeOf(path);
    if (documentType === undefined) {
      return rejectOpen({ kind: "unsupportedExtension", path }, operations);
    }

    const readResult = await operations.readFile(path);
    if (readResult.type === "err") {
      return rejectOpen(
        { kind: "readFailed", error: readResult.error },
        operations,
      );
    }

    if (documentType === "canvas") {
      const parseResult = Serialize.parse(readResult.value);
      if (!parseResult.ok) {
        return rejectOpen(
          { kind: "invalidCanvas", path, error: parseResult.error },
          operations,
        );
      }
    }

    operations.openTab(path, documentType);
    return { status: "opened", path, documentType };
  },
} as const;

/**
 * 文書種別に対応する初期内容を返す。
 *
 * @param documentType 初期内容を作る文書の種別。
 * @returns キャンバスでは空のキャンバス JSON、モデルでは空文字列。
 */
const initialContents = (documentType: TabDocumentType): string =>
  documentType === "canvas" ? Serialize.stringify(Document.empty()) : "";

/**
 * 対応拡張子から文書種別を判定する。
 *
 * @param path 判定するファイルパス。
 * @returns 対応する文書種別。非対応の場合は undefined。
 */
const documentTypeOf = (path: string): TabDocumentType | undefined => {
  const normalized = path.toLowerCase();
  if (normalized.endsWith(".dcanvas")) {
    return "canvas";
  }
  if (normalized.endsWith(".dmodel")) {
    return "model";
  }
  return undefined;
};

/**
 * エラーを通知し、拒否結果を返す。
 *
 * @param error ファイルを開けなかった理由。
 * @param operations エラー通知を行う外部操作。
 * @returns 拒否結果。
 */
const rejectOpen = (
  error: OpenDocumentError,
  operations: OpenDocumentOperations,
): OpenDocumentResult => {
  operations.notifyError(error);
  return { status: "rejected", error };
};
