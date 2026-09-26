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
