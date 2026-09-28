import { clearMocks } from "@tauri-apps/api/mocks";
import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  cleanupApps,
  editModel,
  filePayload,
  mockCommands,
  newDocument,
  renderApp,
  saveShortcut,
} from "./newDocument.test-support";
import {
  addState,
  editAndOpenGraph,
  machineSource,
  openMode,
} from "./model-modes.test-support";

afterEach(() => {
  cleanupApps();
  clearMocks();
  vi.useRealTimers();
});

test("同一の新規文書で data と workflow のプレビューを保ったまま状態遷移図へ切り替えられる", async () => {
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, machineSource);
  expect(host.querySelector('[data-decl-name="注文ID"]')).not.toBeNull();
  expect(host.querySelector('[data-decl-name="注文処理"]')).not.toBeNull();
  await openMode(host, "ステートマシン");
  expect(host.querySelectorAll(".state-machine-screen__node")).toHaveLength(2);
  expect(host.querySelectorAll(".state-machine-screen__edge")).toHaveLength(1);
  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(1);
  await openMode(host, "モデル");
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    machineSource,
  );
  expect(host.querySelector('[data-decl-name="注文処理"]')).not.toBeNull();
});

test("DSL の直接編集がグラフへ反映され、グラフで追加した状態が DSL と保存内容に反映される", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const files = new Map<string, string>();
  const write = (payload: unknown) => {
    const { path, contents } = filePayload(payload);
    files.set(path, contents);
    return { type: "ok" };
  };
  mockCommands({
    save_file_dialog: () => "/order.dmodel",
    create_file: write,
    write_file: write,
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editAndOpenGraph(host, machineSource);
  await saveShortcut();
  expect(files.get("/order.dmodel")).toBe(machineSource);
  await addState(host, "保留");
  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="保留"]'),
  ).not.toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get("/order.dmodel")).toContain("  state: 保留");
  await openMode(host, "モデル");
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    files.get("/order.dmodel"),
  );
  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(1);
});

test("モードをまたいだ Undo と Redo で DSL、グラフ、保存内容が一致する", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const files = new Map<string, string>();
  const write = (payload: unknown) => {
    const { path, contents } = filePayload(payload);
    files.set(path, contents);
    return { type: "ok" };
  };
  mockCommands({
    save_file_dialog: () => "/history.dmodel",
    create_file: write,
    write_file: write,
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, machineSource);
  await saveShortcut();
  await openMode(host, "ステートマシン");
  await addState(host, "保留");
  await openMode(host, "モデル");
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>('button[aria-label="元に戻す"]')
      ?.click(),
  );
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    machineSource,
  );
  await openMode(host, "ステートマシン");
  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="保留"]'),
  ).toBeNull();
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>('button[aria-label="やり直す"]')
      ?.click(),
  );
  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="保留"]'),
  ).not.toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get("/history.dmodel")).toContain("state: 保留");
});

test("state-machine のない新規文書からマシンを作成してモデルへ戻れる", async () => {
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data 注文ID = string");
  await openMode(host, "ステートマシン");
  const name = host.querySelector<HTMLInputElement>(
    'input[aria-label="マシン名"]',
  );
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(name, "注文");
    name?.dispatchEvent(new Event("input", { bubbles: true }));
    name?.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(
    host.querySelector('[aria-label="ステートマシンのグラフ"]'),
  ).not.toBeNull();
  await openMode(host, "モデル");
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toContain(
    "state-machine 注文 =",
  );
  expect(host.querySelector('[data-decl-name="注文ID"]')).not.toBeNull();
});

test("インスペクターで状態名を変えると遷移と DSL が一緒に更新される", async () => {
  const host = renderApp();
  await newDocument(host, "model");
  await editAndOpenGraph(host, machineSource);
  await act(async () =>
    host
      .querySelector('.state-machine-screen__node[aria-label^="待機"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true })),
  );
  const name = host.querySelector<HTMLInputElement>(
    'input[aria-label="状態名"]',
  );
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(name, "保留");
    name?.dispatchEvent(new Event("input", { bubbles: true }));
    name?.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="保留"]'),
  ).not.toBeNull();
  await openMode(host, "モデル");
  const contents = host.querySelector<HTMLTextAreaElement>("textarea")?.value;
  expect(contents).toContain("initial: 保留\n  state: 保留");
  expect(contents).toContain("transition: 保留 -> 完了 on 確定");
});

test("複数マシンの切替と未定義参照、構文エラーの表示中も編集を続けられる", async () => {
  const host = renderApp();
  await newDocument(host, "model");
  const source = `data 注文 = 未定義型\ndata 数量 = int constrained 10..1\n${machineSource}\nstate-machine 返金 =\n  initial: 申請\n  state: 申請`;
  await editModel(host, source);
  expect(
    host.querySelector(".model-editor__diagnostics-warning")?.textContent,
  ).toContain("未定義型");
  expect(host.querySelector(".preview-error-placeholder")).not.toBeNull();
  await openMode(host, "ステートマシン");
  const picker = host.querySelector<HTMLSelectElement>(
    ".state-machine-screen__toolbar select",
  );
  expect(picker?.options).toHaveLength(2);
  await act(async () => {
    if (picker === null) {
      return;
    }
    picker.value = "1";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(
    host
      .querySelector(".state-machine-screen__graph")
      ?.getAttribute("aria-label"),
  ).toBe("返金 の状態遷移図");
  await openMode(host, "モデル");
  await editModel(host, source.replace("未定義型", "string"));
  expect(host.querySelector(".model-editor__diagnostics-warning")).toBeNull();
  expect(host.querySelector('[data-decl-name="返金"]')).not.toBeNull();
});
