import type { FileWriteResult } from "@/types/file-write";
import {
  type FileReadResult,
  type OpenDocumentError,
  type SavePathSelection,
} from "../fileActions";
import { type ExternalFileEventError } from "../external-file-events";
import { TabsState, type TabsAction, type TabDocumentType } from "../tabs";

/** I/Oだけをメモリ上で代替し、タブ更新は実際のreducerに接続する。 */
export const setupFileActions = (selection: SavePathSelection) => {
  const files = new Map<string, string>();
  const errors: (OpenDocumentError | ExternalFileEventError)[] = [];
  let tabs = TabsState.create();
  const dispatchTabs = (action: TabsAction) => {
    tabs = TabsState.reducer(tabs, action);
  };
  const operations = {
    selectSavePath: async () => selection,
    createFile: async (
      path: string,
      contents: string,
    ): Promise<FileWriteResult> => {
      files.set(path, contents);
      return { type: "ok" };
    },
    sameFilePath: async (left: string, right: string) => left === right,
    readFile: async (path: string): Promise<FileReadResult> => {
      const value = files.get(path);
      if (value === undefined) {
        return { type: "err", error: { kind: "notFound", path } };
      }
      return { type: "ok", value };
    },
    openTab: (path: string, documentType: TabDocumentType) =>
      dispatchTabs({ type: "openTab", path, documentType }),
    dispatchTabs,
    notifyError: (error: OpenDocumentError | ExternalFileEventError) => {
      errors.push(error);
    },
    hashContents: (contents: string) => contents,
  };
  return { files, errors, operations, tabs: () => tabs };
};

/**
 * 読み込み結果から内容を取り出す。読めない場合はテストを落とす。
 *
 * @param result 読み込み結果。
 * @returns 読み込めた全文。
 */
export const readContents = (result: FileReadResult): string => {
  if (result.type !== "ok") {
    throw new Error(`ファイルを読めません: ${JSON.stringify(result.error)}`);
  }
  return result.value;
};
