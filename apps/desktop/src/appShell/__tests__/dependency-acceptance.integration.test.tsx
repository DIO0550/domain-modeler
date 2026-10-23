import { clearMocks } from "@tauri-apps/api/mocks";
import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanupApps,
  editModel,
  newDocument,
  saveShortcut,
} from "./newDocument.test-support";
import {
  cleanupDependencyWorkspaces,
  clickDependencyButton,
  dependencyNames,
  dependencyNode,
  openDependencyWorkspace,
} from "./dependency-sync.test-support";
import {
  dependencyRelations,
  renderDependencyApp,
} from "./dependency-acceptance.test-support";

afterEach(() => {
  cleanupApps();
  cleanupDependencyWorkspaces();
  clearMocks();
  vi.restoreAllMocks();
});

test("SYNC-01・10: 新規文書を依存図から初回保存しても本文だけを保存し、再読込で参照方向と役割を復元する", async () => {
  const { host, files } = renderDependencyApp();
  const source = `// 表示状態を含まない本文\r\ndata 注文 = string\r\nworkflow 更新 =\r\n  input: 注文 list option\r\n  output: 注文\r\n  error: 未定義\r\n`;
  await newDocument(host, "model");
  await editModel(host, source);
  // 入力欄の改行表示と、文書が保持するCRLF本文を区別する。
  const edited = host.querySelector("textarea")!.value;
  await clickDependencyButton(host, "依存図");
  const names = dependencyNames(host);
  const relations = dependencyRelations(host);
  act(() => dependencyNode(host, "更新").click());
  await clickDependencyButton(host, "関連のみ");
  await clickDependencyButton(host, "拡大");
  await clickDependencyButton(host, "再配置");

  await saveShortcut();

  expect(host.querySelector('[role="tab"]')!.textContent).toContain(
    "new.dmodel",
  );
  expect(files.get("/new.dmodel")).toBe(source);
  expect(dependencyNode(host, "更新").getAttribute("aria-pressed")).toBe(
    "true",
  );

  cleanupApps();
  const reopened = await openDependencyWorkspace(files);
  expect(reopened.active().querySelector("textarea")!.value).toBe(edited);
  await clickDependencyButton(reopened.active(), "依存図");

  expect(dependencyNames(reopened.active())).toEqual(names);
  expect(dependencyRelations(reopened.active())).toEqual(relations);
  expect(
    reopened.active().querySelector('[data-node-id][aria-pressed="true"]'),
  ).toBeNull();
  expect(reopened.active().querySelector("aside pre")).toBeNull();
});

test("依存図からの初回保存が失敗しても新規文書と選択を保持し、再試行で同じ本文を保存する", async () => {
  const { host, files, storage } = renderDependencyApp();
  const source = "data 注文 = 不明\n";
  await newDocument(host, "model");
  await editModel(host, source);
  await clickDependencyButton(host, "依存図");
  act(() => dependencyNode(host, "注文").click());
  storage.failure = true;

  await saveShortcut();

  expect(files.size).toBe(0);
  expect(host.querySelector('[role="tab"]')!.textContent).toContain("未保存");
  expect(host.querySelector('[role="alert"]')!.textContent).toContain(
    "保存失敗の検証",
  );
  expect(dependencyNames(host)).toEqual(["注文", "不明"]);
  expect(host.querySelector("aside pre")!.textContent).toBe("data 注文 = 不明");

  storage.failure = false;
  await saveShortcut();

  expect(files.get("/new.dmodel")).toBe(source);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(dependencyNode(host, "注文").getAttribute("aria-pressed")).toBe(
    "true",
  );
});
