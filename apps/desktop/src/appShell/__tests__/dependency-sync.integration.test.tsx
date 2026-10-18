import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { editModel } from "./newDocument.test-support";
import {
  cleanupDependencyWorkspaces,
  clickDependencyButton,
  dependencyHistory,
  dependencyNames,
  dependencyNode,
  dependencyTransform,
  openDependencyWorkspace,
  panDependency,
} from "./dependency-sync.test-support";

afterEach(() => {
  cleanupDependencyWorkspaces();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("定義・依存図・ステートマシンを往復しても選択と関連範囲とパン・ズームを保持する", async () => {
  const source =
    "data A = B\ndata B = string\ndata C = int\nstate-machine 処理 =\n  state: 待機\n";
  const files = new Map([["/order.dmodel", source]]);
  const workspace = await openDependencyWorkspace(files);
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "A").click());
  await clickDependencyButton(workspace.active(), "関連のみ");
  await clickDependencyButton(workspace.active(), "拡大");
  panDependency(workspace.active());
  const viewport = dependencyTransform(workspace.active());

  await clickDependencyButton(workspace.active(), "ステートマシン");
  await clickDependencyButton(workspace.active(), "モデル");

  expect(dependencyNames(workspace.active())).toEqual(["A", "B"]);
  expect(
    dependencyNode(workspace.active(), "A").getAttribute("aria-pressed"),
  ).toBe("true");
  expect(dependencyTransform(workspace.active())).toBe(viewport);

  await clickDependencyButton(workspace.active(), "定義＋プレビュー");
  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyTransform(workspace.active())).toBe(viewport);
  expect(dependencyNames(workspace.active())).toEqual(["A", "B"]);
  expect(files.get("/order.dmodel")).toBe(source);
});

test("本文で依存先を追加すると図へ反映し、同じ履歴のUndoとRedoに追従する", async () => {
  const source = "data A = string\n";
  const workspace = await openDependencyWorkspace(
    new Map([["/order.dmodel", source]]),
  );
  await editModel(workspace.active(), "data A = B\ndata B = string\n");
  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyNames(workspace.active())).toEqual(["A", "B"]);
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(1);

  await dependencyHistory(workspace.active());

  expect(dependencyNames(workspace.active())).toEqual(["A"]);
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(0);

  await dependencyHistory(workspace.active(), true);

  expect(dependencyNames(workspace.active())).toEqual(["A", "B"]);
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(1);
});

test("図を非表示にしている間に選択対象を削除して復元しても選択を復活させない", async () => {
  const source = "data A = string\ndata B = int\n";
  const workspace = await openDependencyWorkspace(
    new Map([["/order.dmodel", source]]),
  );
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "B").click());
  await clickDependencyButton(workspace.active(), "関連のみ");
  await clickDependencyButton(workspace.active(), "定義＋プレビュー");
  await editModel(workspace.active(), "data A = string\n");
  await editModel(workspace.active(), source);
  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyNames(workspace.active())).toEqual(["A", "B"]);
  expect(
    workspace.active().querySelector('[data-node-id][aria-pressed="true"]'),
  ).toBeNull();
  expect(
    [...workspace.active().querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "関連のみ")!
      .getAttribute("aria-disabled"),
  ).toBe("true");
});

test("文書を切り替えても各タブの表示方法・選択・詳細・viewportを混在させない", async () => {
  const workspace = await openDependencyWorkspace(
    new Map([
      ["/first.dmodel", "data A = string\n"],
      ["/second.dmodel", "data B = int\n"],
    ]),
  );
  await workspace.activate("/first.dmodel");
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "A").click());
  panDependency(workspace.active());
  const viewport = dependencyTransform(workspace.active());

  await workspace.activate("/second.dmodel");

  expect(workspace.active().querySelector("textarea")!.value).toBe(
    "data B = int\n",
  );

  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyNames(workspace.active())).toEqual(["B"]);
  expect(
    workspace.active().querySelector('[aria-pressed="true"][data-node-id]'),
  ).toBeNull();
  expect(workspace.active().querySelector("aside pre")).toBeNull();

  await workspace.activate("/first.dmodel");

  expect(dependencyNames(workspace.active())).toEqual(["A"]);
  expect(workspace.active().querySelector("aside pre")!.textContent).toBe(
    "data A = string",
  );
  expect(dependencyTransform(workspace.active())).toBe(viewport);
});

test("図の閲覧後も既存の自動保存は本文だけを書き、再読込は選択とviewportを初期化する", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const files = new Map([["/saved.dmodel", "data A = B\ndata B = string\n"]]);
  const workspace = await openDependencyWorkspace(files);
  const source = "// 保存する本文\ndata A = B\ndata B = string\n";
  await editModel(workspace.active(), source);
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "A").click());
  await clickDependencyButton(workspace.active(), "関連のみ");
  panDependency(workspace.active());
  const viewport = dependencyTransform(workspace.active());
  await act(async () => vi.advanceTimersByTimeAsync(1000));

  expect(files.get("/saved.dmodel")).toBe(source);

  cleanupDependencyWorkspaces();
  const reopened = await openDependencyWorkspace(files);

  expect(reopened.active().querySelector("textarea")!.value).toBe(source);
  await clickDependencyButton(reopened.active(), "依存図");

  expect(dependencyNames(reopened.active())).toEqual(["A", "B"]);
  expect(
    reopened.active().querySelector('[data-node-id][aria-pressed="true"]'),
  ).toBeNull();
  expect(dependencyTransform(reopened.active())).not.toBe(viewport);
  expect(files.get("/saved.dmodel")).toBe(source);
});
