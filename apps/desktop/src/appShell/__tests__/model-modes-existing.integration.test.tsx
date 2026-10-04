import { canvasPointer } from "@/libs/svg-canvas/__tests__/svgCanvas.test-support";
import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { machineSource, openMode, addState } from "./model-modes.test-support";
import { openModelWorkspace } from "./model-modes-workspace.test-support";

const opened: Array<ReturnType<typeof openModelWorkspace>> = [];
afterEach(() => {
  for (const workspace of opened.splice(0)) {
    workspace.close();
  }
  vi.useRealTimers();
});

const open = (path: string, files: Map<string, string>) => {
  const workspace = openModelWorkspace(path, files);
  opened.push(workspace);
  return workspace;
};

test("既存の data、workflow、state-machine を同じタブで読み込み各モードに表示する", async () => {
  const path = "/existing.dmodel";
  const workspace = open(path, new Map([[path, machineSource]]));
  await workspace.changed(path);
  expect(
    workspace.host.querySelector<HTMLTextAreaElement>("textarea")?.value,
  ).toBe(machineSource);
  expect(
    workspace.host.querySelector('[data-decl-name="注文ID"]'),
  ).not.toBeNull();
  expect(
    workspace.host.querySelector('[data-decl-name="注文処理"]'),
  ).not.toBeNull();
  await openMode(workspace.host, "ステートマシン");
  expect(
    workspace.host.querySelectorAll(".state-machine-screen__node"),
  ).toHaveLength(2);
  expect(
    workspace.host.querySelectorAll(".state-machine-screen__edge"),
  ).toHaveLength(1);
});

test("state-machine のない既存の data と workflow はモデル表示を保つ", async () => {
  const path = "/legacy.dmodel";
  const source = "data ID = string\nworkflow 保存 =\n  input: ID\n  output: ID";
  const workspace = open(path, new Map([[path, source]]));
  await workspace.changed(path);
  expect(workspace.host.querySelector('[data-decl-name="ID"]')).not.toBeNull();
  expect(
    workspace.host.querySelector('[data-decl-name="保存"]'),
  ).not.toBeNull();
  await openMode(workspace.host, "ステートマシン");
  expect(
    workspace.host.querySelector('input[aria-label="マシン名"]'),
  ).not.toBeNull();
  await openMode(workspace.host, "モデル");
  expect(
    workspace.host.querySelector<HTMLTextAreaElement>("textarea")?.value,
  ).toBe(source);
});

test("保存したグラフ編集を文書セッションの再作成後に再読込できる", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const path = "/reopen.dmodel";
  const files = new Map([[path, machineSource]]);
  const workspace = open(path, files);
  await workspace.changed(path);
  await openMode(workspace.host, "ステートマシン");
  await addState(workspace.host, "保留");
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get(path)).toContain("state: 保留");
  workspace.close();
  opened.splice(opened.indexOf(workspace), 1);
  const reopened = open(path, files);
  await reopened.changed(path);
  await openMode(reopened.host, "ステートマシン");
  expect(
    reopened.host.querySelector(
      '.state-machine-screen__node[aria-label^="保留"]',
    ),
  ).not.toBeNull();
});

test("構文エラーと未定義参照がある既存文書でも複数マシンを切り替えられる", async () => {
  const path = "/broken.dmodel";
  const source = `data 顧客 = 未定義型\ndata 数量 = int constrained 10..1\n${machineSource}\nstate-machine 返金 =\n  state: 申請`;
  const workspace = open(path, new Map([[path, source]]));
  await workspace.changed(path);
  expect(
    workspace.host.querySelector(".model-editor__diagnostics-warning")
      ?.textContent,
  ).toContain("未定義型");
  expect(
    workspace.host.querySelector(".preview-error-placeholder"),
  ).not.toBeNull();
  await openMode(workspace.host, "ステートマシン");
  const picker = workspace.host.querySelector<HTMLSelectElement>(
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
    workspace.host
      .querySelector(".state-machine-screen__graph")
      ?.getAttribute("aria-label"),
  ).toBe("返金 の状態遷移図");
  await openMode(workspace.host, "モデル");
  expect(
    workspace.host.querySelector<HTMLTextAreaElement>("textarea")?.value,
  ).toBe(source);
});


test("配置と移動が自動保存され、モード切替・Undo/Redo・文書再読込後も一致する", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const path = "/placement.dmodel";
  const files = new Map([[path, machineSource]]);
  const workspace = open(path, files);
  await workspace.changed(path);
  await openMode(workspace.host, "ステートマシン");
  const canvas = canvasPointer(workspace.host);
  act(() => [...workspace.host.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "状態")!.click());
  canvas.click({ x: 700, y: 440 });
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  const placed = files.get(path)!;
  expect(placed).toContain("state: 状態1 // @canvas-position(v1, 300, 200)");
  canvas.pointer("pointerdown", { x: 700, y: 440 }, workspace.host.querySelector('[aria-label="状態1 normal"]')!);
  canvas.pointer("pointermove", { x: 900, y: 640 });
  canvas.pointer("pointerup", { x: 900, y: 640 });
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  const moved = files.get(path)!;
  expect(moved).toContain("state: 状態1 // @canvas-position(v1, 400, 300)");
  await openMode(workspace.host, "モデル");
  expect(workspace.host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(moved);
  await openMode(workspace.host, "ステートマシン");
  const graph = workspace.host.querySelector<SVGSVGElement>("svg.state-machine-screen__graph")!;
  act(() => graph.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true })));
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get(path)).toBe(placed);
  act(() => graph.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, bubbles: true })));
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get(path)).toBe(moved);
  workspace.close();
  opened.splice(opened.indexOf(workspace), 1);
  const reopened = open(path, files);
  await reopened.changed(path);
  await openMode(reopened.host, "ステートマシン");
  const rect = reopened.host.querySelector('[aria-label="状態1 normal"] rect')!;
  expect(rect.getAttribute("x")).toBe("320");
  expect(rect.getAttribute("y")).toBe("268");
});
