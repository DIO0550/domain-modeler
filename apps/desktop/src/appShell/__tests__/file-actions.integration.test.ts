import {
  Document,
  History,
  Result,
  Serialize,
} from "@domain-modeler/canvas-core";
import { Parse } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { FileActions } from "../fileActions";
import { ExternalFileEvents } from "../external-file-events";
import { TabsState } from "../tabs";
import {
  readContents,
  setupFileActions,
} from "./fileActions.test-support";

test.each([
  {
    documentType: "canvas",
    path: "/documents/order.dcanvas",
    expectInitialContents: (contents: string) =>
      expect(Result.unwrap(Serialize.parse(contents))).toEqual(
        Document.empty(),
      ),
  },
  {
    documentType: "model",
    path: "/documents/order.dmodel",
    expectInitialContents: (contents: string) => expect(contents).toBe(""),
  },
] as const)(
  "新規$documentTypeを保存して閉じた後、同じファイルを再び開ける",
  async ({ documentType, path, expectInitialContents }) => {
  const app = setupFileActions({ status: "selected", path });
  expect(
    await FileActions.saveNewDocument(documentType, app.operations),
  ).toEqual({ status: "created", path });
  expectInitialContents(readContents(await app.operations.readFile(path)));
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
  },
);

test("同じファイルを開き直すと重複タブを作らず元のタブを前面にする", async () => {
  const path = "/documents/order.dcanvas";
  const app = setupFileActions({ status: "selected", path });
  await FileActions.saveNewDocument("canvas", app.operations);
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
  const app = setupFileActions({ status: "selected", path: "/documents/order.dmodel" });
  await FileActions.saveNewDocument("model", app.operations);
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
  const app = setupFileActions({ status: "cancelled" });
  const contents = "data 数量 = int constrained 10..1\ndata 注文ID = string";
  app.files.set(path, contents);
  expect(await FileActions.openDocument(path, app.operations)).toMatchObject({
    status: "opened",
  });
  const read = await app.operations.readFile(path);
  expect(read).toEqual({ type: "ok", value: contents });
  expect(Parse.parse(readContents(read)).diagnostics).toEqual([
    expect.objectContaining({ severity: "error" }),
  ]);
  expect(app.tabs().tabs).toMatchObject([
    { path, documentType: "model", fileState: { status: "available" } },
  ]);
  expect(app.errors).toEqual([]);
});

test("存在しないファイルを開こうとしても既存タブを閉じずエラーを通知する", async () => {
  const app = setupFileActions({ status: "selected", path: "/documents/order.dcanvas" });
  await FileActions.saveNewDocument("canvas", app.operations);
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
  const app = setupFileActions({ status: "selected", path });
  await FileActions.saveNewDocument("canvas", app.operations);
  const document = {
    documentType: "canvas",
    history: History.create(
      Result.unwrap(
        Serialize.parse(readContents(await app.operations.readFile(path))),
      ),
    ),
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
  const app = setupFileActions({ status: "cancelled" });
  const path = "/documents/order.dmodel";
  app.files.set(path, "data 注文 = string");
  await FileActions.openDocument(path, app.operations);
  const previous = app.tabs();
  expect(await FileActions.saveNewDocument("canvas", app.operations)).toEqual(
    { status: "cancelled" },
  );
  expect(app.tabs()).toEqual(previous);
  expect([...app.files]).toEqual([[path, "data 注文 = string"]]);
});
