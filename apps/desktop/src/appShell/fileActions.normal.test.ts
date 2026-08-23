import { Document, Serialize } from "@domain-modeler/canvas-core";
import { expect, test } from "vitest";
import type { FileWriteResult } from "@/libs/file-write";
import {
  FileActions,
  type FileReadResult,
  type NewDocumentOperations,
  type OpenDocumentError,
  type OpenDocumentOperations,
  type SavePathSelection,
} from "./fileActions";

type OperationCall =
  | Readonly<{ type: "selectSavePath"; documentType: "canvas" | "model" }>
  | Readonly<{ type: "writeFile"; path: string; contents: string }>
  | Readonly<{ type: "readFile"; path: string }>
  | Readonly<{ type: "openTab"; path: string; documentType: "canvas" | "model" }>
  | Readonly<{ type: "notifyError"; error: OpenDocumentError }>;

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

/**
 * 呼び出し履歴を記録するファイルオープン操作を組み立てる。
 *
 * @param calls 操作の呼び出し履歴。
 * @param readResult ファイル読み込み結果。
 * @returns テスト用のファイルオープン操作。
 */
const openOperationsRecording = (
  calls: OperationCall[],
  readResult: FileReadResult,
): OpenDocumentOperations => ({
  readFile: async (path) => {
    calls.push({ type: "readFile", path });
    return readResult;
  },
  openTab: (path, documentType) => {
    calls.push({ type: "openTab", path, documentType });
  },
  notifyError: (error) => {
    calls.push({ type: "notifyError", error });
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

test("正しいキャンバスを読み込むと検証後にタブを開く", async () => {
  const calls: OperationCall[] = [];
  const path = "/documents/context.dcanvas";

  const result = await FileActions.openDocument(
    path,
    openOperationsRecording(calls, {
      type: "ok",
      value: Serialize.stringify(Document.empty()),
    }),
  );

  expect(result).toEqual({ status: "opened", path, documentType: "canvas" });
  expect(calls).toEqual([
    { type: "readFile", path },
    { type: "openTab", path, documentType: "canvas" },
  ]);
});

test("モデルは内容を検証せずタブを開く", async () => {
  const calls: OperationCall[] = [];
  const path = "C:\\documents\\order.dmodel";

  const result = await FileActions.openDocument(
    path,
    openOperationsRecording(calls, {
      type: "ok",
      value: "これは未完成のモデル定義 {",
    }),
  );

  expect(result).toEqual({ status: "opened", path, documentType: "model" });
  expect(calls).toEqual([
    { type: "readFile", path },
    { type: "openTab", path, documentType: "model" },
  ]);
});

test("対応外の拡張子は読み込まず通知する", async () => {
  const calls: OperationCall[] = [];
  const path = "/documents/context.json";
  const error = { kind: "unsupportedExtension", path } as const;

  const result = await FileActions.openDocument(
    path,
    openOperationsRecording(calls, { type: "ok", value: "{}" }),
  );

  expect(result).toEqual({ status: "rejected", error });
  expect(calls).toEqual([{ type: "notifyError", error }]);
});

test("読み込みに失敗するとタブを開かず通知する", async () => {
  const calls: OperationCall[] = [];
  const path = "/documents/missing.dmodel";
  const readError = { kind: "notFound", path } as const;
  const error = { kind: "readFailed", error: readError } as const;

  const result = await FileActions.openDocument(
    path,
    openOperationsRecording(calls, { type: "err", error: readError }),
  );

  expect(result).toEqual({ status: "rejected", error });
  expect(calls).toEqual([
    { type: "readFile", path },
    { type: "notifyError", error },
  ]);
});

test("不正なキャンバスはタブを開かず検証エラーを通知する", async () => {
  const calls: OperationCall[] = [];
  const path = "/documents/broken.dcanvas";

  const result = await FileActions.openDocument(
    path,
    openOperationsRecording(calls, { type: "ok", value: "not json" }),
  );

  expect(result.status).toBe("rejected");
  expect(calls[0]).toEqual({ type: "readFile", path });
  expect(calls[1]).toEqual({
    type: "notifyError",
    error: {
      kind: "invalidCanvas",
      path,
      error: {
        code: "INVALID_JSON",
        message: "JSON could not be parsed",
      },
    },
  });
  expect(calls).toHaveLength(2);
});
