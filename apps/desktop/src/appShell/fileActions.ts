import { Document, Serialize } from "@domain-modeler/canvas-core";
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

/** 新規作成フローが利用する外部操作。 */
export type NewDocumentOperations = Readonly<{
  selectSavePath: (
    documentType: TabDocumentType,
  ) => Promise<SavePathSelection>;
  writeFile: (path: string, contents: string) => Promise<FileWriteResult>;
  openTab: (path: string, documentType: TabDocumentType) => void;
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

/** ファイルの新規作成フローを扱う関数群。 */
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
} as const;

/**
 * 文書種別に対応する初期内容を返す。
 *
 * @param documentType 初期内容を作る文書の種別。
 * @returns キャンバスでは空のキャンバス JSON、モデルでは空文字列。
 */
const initialContents = (documentType: TabDocumentType): string =>
  documentType === "canvas" ? Serialize.stringify(Document.empty()) : "";
