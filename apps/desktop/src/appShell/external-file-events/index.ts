import {
  ExternalChanges,
  type CanvasError,
  type History,
} from "@domain-modeler/canvas-core";
import type { FileReadError, FileReadResult } from "../fileActions";
import type { TabActivation, TabsAction } from "../tabs";

/** 外部変更を受け取るキャンバス文書。 */
export type ExternalCanvasDocument = Readonly<{
  documentType: "canvas";
  history: History;
}>;

/** 外部変更を受け取るモデル文書。 */
export type ExternalModelDocument = Readonly<{
  documentType: "model";
  contents: string;
}>;

/** ファイル監視対象として開いている文書。 */
export type ExternalFileDocument =
  | ExternalCanvasDocument
  | ExternalModelDocument;

/** changed イベントを処理する時点の文書と保存状態。 */
export type ExternalFileChange = Readonly<{
  path: string;
  activation: TabActivation;
  lastSavedHash: string;
  document: ExternalFileDocument;
}>;

/** deleted イベントを処理する時点の文書。 */
export type ExternalFileDeletion = Readonly<{
  path: string;
  document: ExternalFileDocument;
}>;

/** 外部ファイルイベントを処理できなかった理由。 */
export type ExternalFileEventError =
  | Readonly<{ kind: "readFailed"; error: FileReadError }>
  | Readonly<{
      kind: "invalidCanvas";
      path: string;
      error: CanvasError;
    }>;

/** 外部ファイルイベント処理が利用する I/O と通知操作。 */
export type ExternalFileEventOperations = Readonly<{
  readFile: (path: string) => Promise<FileReadResult>;
  hashContents: (contents: string) => string;
  dispatchTabs: (
    action: Extract<
      TabsAction,
      {
        type:
          | "markFileMissing"
          | "clearFileMissing"
          | "markBackgroundChanged";
      }
    >,
  ) => void;
  notifyError: (error: ExternalFileEventError) => void;
}>;

/** changed イベントの処理結果。 */
export type ExternalFileChangeResult =
  | Readonly<{ status: "ignored"; document: ExternalFileDocument }>
  | Readonly<{
      status: "applied";
      document: ExternalFileDocument;
      fileHash: string;
    }>
  | Readonly<{
      status: "rejected";
      document: ExternalFileDocument;
      error: ExternalFileEventError;
    }>;

/** deleted イベントの処理結果。 */
export type ExternalFileDeletionResult = Readonly<{
  status: "missing";
  document: ExternalFileDocument;
}>;

/** ファイル監視イベントを開いている文書へ反映する関数群。 */
export const ExternalFileEvents = {
  /**
   * changed イベントの内容を読み、自己書き込みでなければ文書へ反映する。
   *
   * @param change 対象文書、タブ状態、直近保存ハッシュ。
   * @param operations 読み込み、ハッシュ計算、タブ更新、エラー通知。
   * @returns 無視、取り込み成功、または取り込み拒否。
   */
  async handleChanged(
    change: ExternalFileChange,
    operations: ExternalFileEventOperations,
  ): Promise<ExternalFileChangeResult> {
    const readResult = await operations.readFile(change.path);
    if (readResult.type === "err") {
      const error = {
        kind: "readFailed",
        error: readResult.error,
      } as const;
      operations.notifyError(error);
      return { status: "rejected", document: change.document, error };
    }

    operations.dispatchTabs({
      type: "clearFileMissing",
      path: change.path,
    });
    const fileHash = operations.hashContents(readResult.value);
    if (fileHash === change.lastSavedHash) {
      return { status: "ignored", document: change.document };
    }

    const applied = applyContents(change.document, readResult.value);
    if (!applied.ok) {
      const error = {
        kind: "invalidCanvas",
        path: change.path,
        error: applied.error,
      } as const;
      operations.notifyError(error);
      return { status: "rejected", document: change.document, error };
    }

    if (change.activation === "background") {
      operations.dispatchTabs({
        type: "markBackgroundChanged",
        path: change.path,
      });
    }
    return { status: "applied", document: applied.document, fileHash };
  },

  /**
   * deleted イベントを欠損状態としてタブへ反映する。
   *
   * @param deletion 削除されたパスと現在の文書。
   * @param operations タブ更新操作。
   * @returns 文書を維持した欠損状態。
   */
  handleDeleted(
    deletion: ExternalFileDeletion,
    operations: ExternalFileEventOperations,
  ): ExternalFileDeletionResult {
    operations.dispatchTabs({
      type: "markFileMissing",
      path: deletion.path,
    });
    return { status: "missing", document: deletion.document };
  },
} as const;

type ApplyContentsResult =
  | Readonly<{ ok: true; document: ExternalFileDocument }>
  | Readonly<{ ok: false; error: CanvasError }>;

/**
 * 読み込んだ内容を文書種別に応じて置き換える。
 *
 * @param document 取り込み前の文書。
 * @param contents 外部ファイルから読んだ内容。
 * @returns 置換後の文書、またはキャンバス検証エラー。
 */
const applyContents = (
  document: ExternalFileDocument,
  contents: string,
): ApplyContentsResult => {
  if (document.documentType === "model") {
    return {
      ok: true,
      document: { documentType: "model", contents },
    };
  }

  const result = ExternalChanges.apply(document.history, contents);
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    document: { documentType: "canvas", history: result.value },
  };
};
