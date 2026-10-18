import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanupDependencyWorkspaces,
  clickDependencyButton,
  dependencyHistory,
  dependencyNames,
  dependencyNode,
  openDependencyWorkspace,
} from "./dependency-sync.test-support";

afterEach(() => {
  cleanupDependencyWorkspaces();
  vi.restoreAllMocks();
});

test("未定義名のスタブ生成で選択を定義ノードへ引き継ぎ、UndoとRedoも図へ反映する", async () => {
  const workspace = await openDependencyWorkspace(
    new Map([["/stub.dmodel", "data 注文 = 未定義型\n"]]),
  );
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "未定義型").click());
  await clickDependencyButton(workspace.active(), "関連のみ");
  await clickDependencyButton(workspace.active(), "定義＋プレビュー");
  const badge = workspace
    .active()
    .querySelector<HTMLButtonElement>(".preview-data-card__undefined-badge")!;

  await act(async () => badge.click());
  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyNames(workspace.active())).toEqual(["注文", "未定義型"]);
  expect(dependencyNode(workspace.active(), "未定義型").dataset.kind).toBe(
    "ALIAS",
  );
  expect(
    dependencyNode(workspace.active(), "未定義型").getAttribute("aria-pressed"),
  ).toBe("true");
  expect(workspace.active().querySelector("aside pre")!.textContent).toContain(
    "data 未定義型 = string",
  );
  expect(
    workspace.active().querySelector(".dependency-view__diagnostics"),
  ).toBeNull();

  await dependencyHistory(workspace.active());

  expect(dependencyNode(workspace.active(), "未定義型").dataset.kind).toBe(
    "未定義",
  );
  expect(workspace.active().querySelector("aside pre")).toBeNull();

  await dependencyHistory(workspace.active(), true);

  expect(dependencyNode(workspace.active(), "未定義型").dataset.kind).toBe(
    "ALIAS",
  );
});

test("既存のリネームが参照と図を更新し、識別不能になった選択は解除する", async () => {
  const workspace = await openDependencyWorkspace(
    new Map([["/rename.dmodel", "data 注文ID = string\ndata 注文 = 注文ID\n"]]),
  );
  await clickDependencyButton(workspace.active(), "依存図");
  act(() => dependencyNode(workspace.active(), "注文ID").click());
  await clickDependencyButton(workspace.active(), "関連のみ");
  await clickDependencyButton(workspace.active(), "定義＋プレビュー");
  await clickDependencyButton(workspace.active(), "「注文ID」をリネーム");
  const input = workspace
    .active()
    .querySelector<HTMLInputElement>('input[aria-label="新しい名前"]')!;

  await act(async () => {
    input.value = "商品ID";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  await clickDependencyButton(workspace.active(), "依存図");

  expect(dependencyNames(workspace.active())).toEqual(["商品ID", "注文"]);
  expect(
    workspace.active().querySelectorAll(".dependency-view__edges g"),
  ).toHaveLength(1);
  expect(
    workspace.active().querySelector('[data-node-id][aria-pressed="true"]'),
  ).toBeNull();
  expect(workspace.active().querySelector("aside pre")).toBeNull();

  await dependencyHistory(workspace.active());

  expect(dependencyNames(workspace.active())).toEqual(["注文ID", "注文"]);
});
