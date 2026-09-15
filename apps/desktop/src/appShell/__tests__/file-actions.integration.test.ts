import {
  Document,
  History,
  Result,
  Serialize,
} from "@domain-modeler/canvas-core";
import { Parse } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import type { FileWriteResult } from "@/libs/file-write";
import {
  FileActions,
  type FileReadResult,
  type OpenDocumentError,
  type SavePathSelection,
} from "../fileActions";
import {
  ExternalFileEvents,
  type ExternalFileEventError,
} from "../external-file-events";
import { TabsState, type TabsAction, type TabDocumentType } from "../tabs";

/** I/Oだけをメモリ上で代替し、タブ更新は実際のreducerに接続する。 */
const setup = (selection: SavePathSelection) => {
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

test.each([
  "canvas",
  "model",
] as const)("新規%sを保存して閉じた後、同じファイルを再び開ける", async (documentType) => {
  const path = `/documents/order.${documentType === "canvas" ? "dcanvas" : "dmodel"}`;
  const app = setup({ status: "selected", path });
  expect(
    await FileActions.createNewDocument(documentType, app.operations),
  ).toEqual({ status: "created", path });
  const saved = await app.operations.readFile(path);
  if (saved.type !== "ok") {
    throw new Error("作成したファイルを読めません");
  }
  if (documentType === "canvas") {
    expect(Result.unwrap(Serialize.parse(saved.value))).toEqual(
      Document.empty(),
    );
  }
  if (documentType === "model") {
    expect(saved.value).toBe("");
  }
  app.operations.dispatchTabs({ type: "closeTab", path });
  expect(app.tabs()).toEqual(TabsState.create());
  expect(await FileActions.openDocument(path, app.operations)).toEqual({
    status: "opened",
    path,
    documentType,
  });
  expect(app.tabs()).toMatchObject({
    status: "active",
    activePath: path,
    tabs: [{ path, documentType, fileState: { status: "available" } }],
  });
  expect(app.errors).toEqual([]);
});

test("同じファイルを開き直すと重複タブを作らず元のタブを前面にする", async () => {
  const path = "/documents/order.dcanvas";
  const app = setup({ status: "selected", path });
  await FileActions.createNewDocument("canvas", app.operations);
  app.files.set("/documents/other.dmodel", "data 顧客 = string");
  await FileActions.openDocument("/documents/other.dmodel", app.operations);
  await FileActions.openDocument(path, app.operations);
  expect(app.tabs()).toMatchObject({ status: "active", activePath: path });
  expect(app.tabs().tabs.map((tab) => tab.path)).toEqual([
    path,
    "/documents/other.dmodel",
  ]);
});

test.each([
  "not json",
  JSON.stringify({ ...Document.empty(), stickies: [{ id: "invalid" }] }),
])("不正キャンバス %s を開いても既存タブとファイルを変更しない", async (contents) => {
  const app = setup({ status: "selected", path: "/documents/order.dmodel" });
  await FileActions.createNewDocument("model", app.operations);
  const previous = app.tabs();
  const path = "/documents/broken.dcanvas";
  app.files.set(path, contents);
  expect(await FileActions.openDocument(path, app.operations)).toMatchObject({
    status: "rejected",
    error: { kind: "invalidCanvas", path },
  });
  expect(app.tabs()).toEqual(previous);
  expect(app.files.get(path)).toBe(contents);
  expect(app.errors).toEqual([
    expect.objectContaining({ kind: "invalidCanvas", path }),
  ]);
});

test("構文エラーのあるモデルも全文を保持してタブを開ける", async () => {
  const path = "/documents/broken.dmodel";
  const app = setup({ status: "cancelled" });
  const contents = "data 数量 = int constrained 10..1\ndata 注文ID = string";
  app.files.set(path, contents);
  expect(await FileActions.openDocument(path, app.operations)).toMatchObject({
    status: "opened",
  });
  const read = await app.operations.readFile(path);
  expect(read).toEqual({ type: "ok", value: contents });
  if (read.type !== "ok") {
    throw new Error("モデルを読めません");
  }
  expect(Parse.parse(read.value).diagnostics).toEqual([
    expect.objectContaining({ severity: "error" }),
  ]);
  expect(app.tabs().tabs).toMatchObject([
    { path, documentType: "model", fileState: { status: "available" } },
  ]);
  expect(app.errors).toEqual([]);
});

test("存在しないファイルを開こうとしても既存タブを閉じずエラーを通知する", async () => {
  const app = setup({ status: "selected", path: "/documents/order.dcanvas" });
  await FileActions.createNewDocument("canvas", app.operations);
  const previous = app.tabs();
  const path = "/documents/missing.dmodel";
  expect(await FileActions.openDocument(path, app.operations)).toEqual({
    status: "rejected",
    error: { kind: "readFailed", error: { kind: "notFound", path } },
  });
  expect(app.tabs()).toEqual(previous);
  expect(app.files.has(path)).toBe(false);
  expect(app.errors).toEqual([
    { kind: "readFailed", error: { kind: "notFound", path } },
  ]);
});

test("開いたキャンバスが外部で削除されても文書とタブは欠損状態で残る", async () => {
  const path = "/documents/order.dcanvas";
  const app = setup({ status: "selected", path });
  await FileActions.createNewDocument("canvas", app.operations);
  const read = await app.operations.readFile(path);
  if (read.type !== "ok") {
    throw new Error("キャンバスを読めません");
  }
  const document = {
    documentType: "canvas",
    history: History.create(Result.unwrap(Serialize.parse(read.value))),
  } as const;
  app.files.delete(path);
  expect(
    ExternalFileEvents.handleDeleted({ path, document }, app.operations),
  ).toEqual({ status: "missing", document });
  expect(app.tabs()).toMatchObject({
    status: "active",
    activePath: path,
    tabs: [{ path, fileState: { status: "missing" } }],
  });
  expect(app.files.has(path)).toBe(false);
  expect(app.errors).toEqual([]);
});

test("新規作成をキャンセルすると既存タブも保存済みファイルも変わらない", async () => {
  const app = setup({ status: "cancelled" });
  const path = "/documents/order.dmodel";
  app.files.set(path, "data 注文 = string");
  await FileActions.openDocument(path, app.operations);
  const previous = app.tabs();
  expect(await FileActions.createNewDocument("canvas", app.operations)).toEqual(
    { status: "cancelled" },
  );
  expect(app.tabs()).toEqual(previous);
  expect([...app.files]).toEqual([[path, "data 注文 = string"]]);
});
