import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const diagnostics = createDiagnosticsRenderer();
afterEach(() => diagnostics.unmountAll());

const type = (input: HTMLInputElement, value: string) => {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

const click = (element: Element | null) => {
  act(() => element?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
};

const machine = `data 注文ID = string
state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`;

test("モデル定義とプレビューを保ったまま画面全体を切り替える", () => {
  const host = diagnostics.render(machine);
  expect(host.querySelector('[aria-label="テキストエディタ"]')).not.toBeNull();
  expect(host.querySelector('[data-decl-name="注文ID"]')).not.toBeNull();
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  expect(host.querySelector('[aria-label="テキストエディタ"]')).toBeNull();
  expect(host.querySelector('[aria-label="ステートマシンのパレット"]')).not.toBeNull();
  expect(host.querySelector('[aria-label="ステートマシンのインスペクター"]')).not.toBeNull();
  expect(host.querySelectorAll(".state-machine-screen__node")).toHaveLength(2);
  expect(host.querySelectorAll(".state-machine-screen__edge")).toHaveLength(1);
  expect(host.textContent).toContain("確定");
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "モデル") ?? null);
  expect(host.querySelector('[aria-label="テキストエディタ"]')).not.toBeNull();
  expect(host.querySelector('[data-decl-name="注文ID"]')).not.toBeNull();
});

test("空状態からマシンを作成しても同じ文書を更新する", () => {
  let latest = "data 注文ID = string";
  const host = diagnostics.render(latest, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const name = host.querySelector('input[aria-label="マシン名"]') as HTMLInputElement;
  type(name, "注文");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("state-machine 注文 =");
  expect(host.querySelector('[aria-label="ステートマシンのグラフ"]')).not.toBeNull();
});

test("ノード選択と診断表示、明示的な追加操作", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click(host.querySelector(".state-machine-screen__node"));
  expect(host.querySelector(".state-machine-screen__node[data-selected='true']")).not.toBeNull();
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  expect(host.querySelector(".state-machine-screen__node[data-selected='true']")).toBeNull();
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "保留");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  state: 保留");
  expect(host.querySelectorAll(".state-machine-screen__node")).toHaveLength(3);
});

test("空白クリックでは追加せず、キーボードで遷移を選択しズームを戻せる", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const graph = host.querySelector(".state-machine-screen__graph") as SVGSVGElement;
  const initialViewBox = graph.getAttribute("viewBox");
  click(host.querySelector('button[aria-label="拡大"]'));
  expect(graph.getAttribute("viewBox")).not.toBe(initialViewBox);
  click([...host.querySelectorAll("button")].find((button) => button.textContent === "フィット") ?? null);
  expect(graph.getAttribute("viewBox")).toBe(initialViewBox);
  const edge = host.querySelector(".state-machine-screen__edge");
  act(() => edge?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(host.querySelector(".state-machine-screen__edge[data-selected='true']")).not.toBeNull();
  click(host.querySelector(".state-machine-screen__viewport"));
  expect(latest).toBe(machine);
});

test("マシン切替時に選択と倍率を一緒に戻す", () => {
  const source = `${machine}\nstate-machine 返金 =\n  initial: 申請\n  state: 申請`;
  const host = diagnostics.render(source);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const graph = host.querySelector(".state-machine-screen__graph") as SVGSVGElement;
  click(host.querySelector(".state-machine-screen__node"));
  click(host.querySelector('button[aria-label="拡大"]'));
  const picker = host.querySelector(".state-machine-screen__toolbar select") as HTMLSelectElement;
  act(() => {
    picker.value = "1";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(host.querySelector(".state-machine-screen__graph")?.getAttribute("aria-label")).toBe("返金 の状態遷移図");
  expect(host.querySelector(".state-machine-screen__node[data-selected='true']")).toBeNull();
  expect(graph.getAttribute("viewBox")?.startsWith("0 0 ")).toBe(true);
});

test("初期状態の入力欄は可視ラベルとアクセシブルネームが一致する", () => {
  const host = diagnostics.render("state-machine 注文 =\n  state: 待機");
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "初期") ?? null);
  expect(host.querySelector('input[aria-label="既存の状態名"]')).not.toBeNull();
});

test("追加対象の切替で前のフォーム入力とエラーを引き継がない", () => {
  const host = diagnostics.render(machine);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  const stateName = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(stateName, "with space");
  act(() => stateName.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("有効な状態名を入力してください");

  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "終端") ?? null);
  expect((host.querySelector('input[aria-label="状態名"]') as HTMLInputElement).value).toBe("");
  expect(host.querySelector('[role="alert"]')).toBeNull();
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  expect((host.querySelector('input[aria-label="状態名"]') as HTMLInputElement).value).toBe("");
});

test("状態のプロパティを変更するとDSLとグラフが同期し、一度のUndoで戻る", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click(host.querySelector('.state-machine-screen__node[aria-label^="待機"]'));
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "保留");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("initial: 保留\n  state: 保留");
  expect(latest).toContain("transition: 保留 -> 完了 on 確定");
  expect(host.querySelector('.state-machine-screen__node[aria-label^="保留"][data-selected="true"]')).not.toBeNull();
  act(() => host.querySelector('.state-machine-screen__node[data-selected="true"]')
    ?.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true })));
  expect(latest).toBe(machine);
  act(() => host.querySelector(".state-machine-screen__toolbar select")
    ?.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, bubbles: true })));
  expect(latest).toContain("state: 保留");
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "モデル") ?? null);
  expect((host.querySelector("textarea") as HTMLTextAreaElement).value).toContain("state: 保留");
});

test("不正な編集は入力を保ち、診断を表示して文書を変更しない", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click(host.querySelector('.state-machine-screen__node[aria-label^="待機"]'));
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "with space");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toBe(machine);
  expect(name.value).toBe("with space");
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("有効な状態名");
});

test("文書タイトル行へUndoとRedoの可用性を通知する", () => {
  let latest = machine;
  let controls: Readonly<{ undo?: () => void; redo?: () => void }> = {};
  const host = diagnostics.render(machine, (value) => { latest = value; }, (value) => { controls = value; });
  expect(controls.undo).toBeUndefined();
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "保留");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(controls.undo).toBeDefined();
  act(() => controls.undo?.());
  expect(latest).toBe(machine);
  expect(controls.redo).toBeDefined();
  act(() => controls.redo?.());
  expect(latest).toContain("state: 保留");
});

test("遷移の接続先変更と削除後もフォーカスを保ち、キーボードでUndoできる", async () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const edge = host.querySelector(".state-machine-screen__edge");
  act(() => edge?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  const target = host.querySelector('select[aria-label="遷移先"]') as HTMLSelectElement;
  act(() => { target.value = "待機"; target.dispatchEvent(new Event("change", { bubbles: true })); });
  act(() => target.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("transition: 待機 -> 待機 on 確定");
  const deleteButton = [...host.querySelectorAll("button")].find((button) => button.textContent === "削除");
  click(deleteButton ?? null);
  expect(latest).not.toContain("transition:");
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const focused = document.activeElement;
  expect(focused).toBe(host.querySelector(".state-machine-screen__toolbar select"));
  act(() => focused?.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true })));
  expect(latest).toContain("transition: 待機 -> 待機 on 確定");
});
