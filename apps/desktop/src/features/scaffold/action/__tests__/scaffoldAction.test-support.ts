import { Document } from "@domain-modeler/canvas-core";
import type { FileWriteResult } from "@/types/file-write";
import { Option } from "@/utils/Option";

/**
 * 既存ファイルを上書きしない新規作成の代用。
 *
 * @param files パスから内容を引くテスト用のファイルシステム。
 * @returns 既存パスなら書き込み失敗、空きパスなら作成して成功を返す操作。
 */
const createFileInto =
  (files: Map<string, string>) =>
  async (
    target: Readonly<{ path: string; contents: string }>,
  ): Promise<FileWriteResult> => {
    if (files.has(target.path)) {
      return {
        type: "err",
        error: {
          kind: "writeFailed",
          path: target.path,
          message: "already exists",
        },
      };
    }
    files.set(target.path, target.contents);
    return { type: "ok" };
  };

/**
 * 生成元のキャンバスと、確認・保存・タブ追加の接続先を組み立てる。
 *
 * @returns 生成元、外部操作、および呼び出しの記録。
 */
export function setupScaffoldAction() {

  const openedTabs: Readonly<{ path: string; documentType: "model" }>[] = [];
  const files = new Map<string, string>([
    ["/source.dcanvas", "original canvas"],
  ]);
  const previews: string[] = [];
  const source = {
    activeDocument: Option.some({
      kind: "canvas" as const,
      document: { ...Document.empty(), title: "注文" },
    }),
    generatedOn: "2026-09-14",
  };
  const createFile = createFileInto(files);
  const operations = {
    createFile,
    confirm: async (text: string): Promise<"confirmed" | "cancelled"> => {
      previews.push(text);
      return "confirmed";
    },
    selectSavePath: async () => Option.some("/generated.dmodel"),
    openTab: (path: string, documentType: "model") => {
      openedTabs.push({ path, documentType });
    },
  };
  return { source, operations, files, previews, openedTabs };
}
