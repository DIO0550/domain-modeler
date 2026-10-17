import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { editModel } from "./newDocument.test-support";
import {
  cleanupDependencyWorkspaces,
  clickDependencyButton,
  dependencyNames,
  dependencyNode,
  dependencyTransform,
  openDependencyWorkspace,
} from "./dependency-sync.test-support";

afterEach(() => {
  cleanupDependencyWorkspaces();
  vi.restoreAllMocks();
});

test("外部から採用した部分ASTと診断を表示し、前の本文の定義を混ぜない", async () => {
  const path = "/external.dmodel";
  const files = new Map([[path, "data 旧モデル = string\n"]]);
  const workspace = await openDependencyWorkspace(files);
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "旧モデル").click());
  files.set(path, "data =\ndata 新モデル = 不明\n");

  await workspace.changed(path);

  expect(dependencyNames(workspace.active())).toEqual(["新モデル", "不明"]);
  expect(
    workspace.active().querySelector(".dependency-view__diagnostics")!
      .textContent,
  ).toContain("診断");
  expect(workspace.active().querySelector("aside pre")).toBeNull();
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(1);
});

test.each([
  "invalidUtf8",
  "readFailed",
] as const)("外部ファイルの%sでは採用済み本文の図・選択・表示位置を維持する", async (kind) => {
  const path = "/external.dmodel";
  const files = new Map([[path, "data 現在 = string\n"]]);
  const workspace = await openDependencyWorkspace(files);
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "現在").click());
  const viewport = dependencyTransform(workspace.active());
  workspace.failures.set(path, { kind, path, message: "読み込み失敗" });
  files.set(path, "data 未採用 = int\n");

  await workspace.changed(path);

  expect(dependencyNames(workspace.active())).toEqual(["現在"]);
  expect(workspace.active().querySelector("aside pre")!.textContent).toBe(
    "data 現在 = string",
  );
  expect(dependencyTransform(workspace.active())).toBe(viewport);
  expect(
    workspace.active().querySelector(".document-workspace__banner")!
      .textContent,
  ).toContain("読み込めませんでした");
  await clickDependencyButton(workspace.active(), "定義＋プレビュー");
  expect(workspace.active().querySelector("textarea")!.value).toBe(
    "data 現在 = string\n",
  );
});

test("競合の採用待ちでは編集本文の図を維持し、外部変更を選んだ後に更新する", async () => {
  const path = "/conflict.dmodel";
  const files = new Map([[path, "data 元 = string\n"]]);
  const workspace = await openDependencyWorkspace(files);
  await editModel(workspace.active(), "data 編集中 = int\n");
  await clickDependencyButton(workspace.active(), "依存図");
  files.set(path, "data 外部 = string\n");

  await workspace.changed(path);

  expect(dependencyNames(workspace.active())).toEqual(["編集中"]);
  await clickDependencyButton(workspace.active(), "外部変更を読み込む");
  expect(dependencyNames(workspace.active())).toEqual(["外部"]);
});

test("連続する外部変更の後に古い計測が到着しても最新本文の配置を上書きしない", async () => {
  const path = "/continuous.dmodel";
  const files = new Map([[path, "data A = string\n"]]);
  const workspace = await openDependencyWorkspace(files, {
    delayMeasurements: true,
  });
  await clickDependencyButton(workspace.active(), "依存図");
  workspace.measure();
  files.set(path, "data B = int\n");
  await workspace.changed(path);
  files.set(path, "data C = D\ndata D = string\n");
  await workspace.changed(path);
  workspace.measure();
  const viewport = dependencyTransform(workspace.active());

  workspace.measure(0);
  workspace.measure(1);

  expect(dependencyNames(workspace.active())).toEqual(["C", "D"]);
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(1);
  expect(dependencyTransform(workspace.active())).toBe(viewport);
});

test("先頭への行追加後は未計測の間でも最新本文の正しい定義へ移動する", async () => {
  const path = "/location.dmodel";
  const source = "data A = B\ndata B = string\n";
  const files = new Map([[path, source]]);
  const workspace = await openDependencyWorkspace(files, {
    delayMeasurements: true,
  });
  await clickDependencyButton(workspace.active(), "依存図");
  workspace.measure();
  act(() => dependencyNode(workspace.active(), "B").click());
  files.set(path, `// 先頭へ追加\n\n${source}`);
  await workspace.changed(path);
  workspace.measure(0);

  expect(workspace.active().querySelector("[data-node-id]")).toBeNull();
  await clickDependencyButton(workspace.active(), "定義を編集");
  const editor = workspace.active().querySelector("textarea")!;

  expect(editor.selectionStart).toBe(editor.value.indexOf("data B"));
  expect(editor.value.slice(editor.selectionStart, editor.selectionEnd)).toBe(
    "data B = string",
  );
  expect(editor.value).toBe(files.get(path));
});
