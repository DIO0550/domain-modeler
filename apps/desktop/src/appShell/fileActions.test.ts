import { Document, Serialize } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import {
  FileActions,
  type FileWriteResult,
  type NewDocumentOperations,
  type SavePathSelection,
} from "./fileActions";

type OperationCall =
  | Readonly<{ type: "selectSavePath"; documentType: "canvas" | "model" }>
  | Readonly<{ type: "writeFile"; path: string; contents: string }>
  | Readonly<{ type: "openTab"; path: string; documentType: "canvas" | "model" }>;

/**
 * 呼び出し履歴を記録する新規作成操作を組み立てる。
 *
 * @param calls 操作の呼び出し履歴。
 * @param selection 保存ダイアログの選択結果。
 * @param writeResult ファイル書き込み結果。
 * @returns テスト用の新規作成操作。
 */
const operationsRecording = (
  calls: OperationCall[],
  selection: SavePathSelection,
  writeResult: FileWriteResult = { type: "ok" },
): NewDocumentOperations => ({
  selectSavePath: async (documentType) => {
    calls.push({ type: "selectSavePath", documentType });
    return selection;
  },
  writeFile: async (path, contents) => {
    calls.push({ type: "writeFile", path, contents });
    return writeResult;
  },
  openTab: (path, documentType) => {
    calls.push({ type: "openTab", path, documentType });
  },
});

test("キャンバスの保存先を選ぶと空の初期内容を書いてからタブを開く", async () => {
  const calls: OperationCall[] = [];

  const result = await FileActions.createNewDocument(
    "canvas",
    operationsRecording(calls, {
      status: "selected",
      path: "/documents/context.dcanvas",
    }),
  );

  expect(result).toEqual({
    status: "created",
    path: "/documents/context.dcanvas",
  });
  expect(calls).toEqual([
    { type: "selectSavePath", documentType: "canvas" },
    {
      type: "writeFile",
      path: "/documents/context.dcanvas",
      contents: Serialize.stringify(Document.empty()),
    },
    {
      type: "openTab",
      path: "/documents/context.dcanvas",
      documentType: "canvas",
    },
  ]);
});

test("モデルの保存先を選ぶと空文字を書いてからタブを開く", async () => {
  const calls: OperationCall[] = [];

  const result = await FileActions.createNewDocument(
    "model",
    operationsRecording(calls, {
      status: "selected",
      path: "/documents/order.dmodel",
    }),
  );

  expect(result).toEqual({
    status: "created",
    path: "/documents/order.dmodel",
  });
  expect(calls).toEqual([
    { type: "selectSavePath", documentType: "model" },
    {
      type: "writeFile",
      path: "/documents/order.dmodel",
      contents: "",
    },
    {
      type: "openTab",
      path: "/documents/order.dmodel",
      documentType: "model",
    },
  ]);
});

test("保存先の選択をキャンセルすると状態を変更しない", async () => {
  const calls: OperationCall[] = [];

  const result = await FileActions.createNewDocument(
    "canvas",
    operationsRecording(calls, { status: "cancelled" }),
  );

  expect(result).toEqual({ status: "cancelled" });
  expect(calls).toEqual([
    { type: "selectSavePath", documentType: "canvas" },
  ]);
});

test("初期内容を書き込めないとタブを開かない", async () => {
  const calls: OperationCall[] = [];
  const error = {
    kind: "writeFailed",
    path: "/documents/context.dcanvas",
    message: "permission denied",
  } as const;

  const result = await FileActions.createNewDocument(
    "canvas",
    operationsRecording(
      calls,
      { status: "selected", path: "/documents/context.dcanvas" },
      {
        type: "err",
        error,
      },
    ),
  );

  expect(result).toEqual({ status: "writeFailed", error });
  expect(calls).toHaveLength(2);
  expect(calls[1]?.type).toBe("writeFile");
});
