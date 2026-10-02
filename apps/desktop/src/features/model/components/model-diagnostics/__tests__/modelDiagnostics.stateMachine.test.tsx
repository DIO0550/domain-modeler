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

test("マシンがある文書でもツールバーから新しいマシンを作成し、重複名は作成前に拒否する", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const start = [...host.querySelectorAll(".state-machine-screen__toolbar button")].find((button) => button.textContent?.includes("新しいマシン")) ?? null;
  click(start);
  expect(start?.getAttribute("aria-pressed")).toBe("true");
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("新しいマシン");
  const submit = () => {
    const name = host.querySelector('input[aria-label="マシン名"]') as HTMLInputElement;
    act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  };
  type(host.querySelector('input[aria-label="マシン名"]') as HTMLInputElement, "注文ID");
  submit();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("「注文ID」は既に宣言されています");
  expect(latest).toBe(machine);

  type(host.querySelector('input[aria-label="マシン名"]') as HTMLInputElement, "返金");
  submit();
  expect(latest).toContain("state-machine 返金 =");
  const select = host.querySelector(".state-machine-screen__toolbar select") as HTMLSelectElement;
  expect(select.options[select.selectedIndex]?.textContent).toBe("返金");
  expect(start?.getAttribute("aria-pressed")).toBe("false");

  click(start);
  act(() => host.querySelector(".state-machine-screen")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(host.querySelector('input[aria-label="マシン名"]')).toBeNull();
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

test("パレットは状態と遷移だけで、状態の追加時に初期・終端を指定できる", () => {
  let latest = "state-machine 注文 =\n  state: 待機";
  const host = diagnostics.render(latest, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  expect([...host.querySelectorAll(".state-machine-screen__palette button")].map((button) => button.textContent))
    .toEqual(["状態", "遷移"]);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "受付");
  const checkbox = (label: string) => [...host.querySelectorAll(".state-machine-screen__checkbox")]
    .find((item) => item.textContent === label)?.querySelector("input") ?? null;
  click(checkbox("初期状態"));
  click(checkbox("終端状態"));
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toBe("state-machine 注文 =\n  state: 待機\n  initial: 受付\n  state: 受付 terminal");
  expect(host.querySelector('.state-machine-screen__node[aria-label="受付 initial-terminal"]')).not.toBeNull();
  expect(host.querySelector('.state-machine-screen__node[aria-label="受付 initial-terminal"]')?.getAttribute("data-selected")).toBe("true");
  expect((checkbox("初期状態") as HTMLInputElement).checked).toBe(true);
});

test("追加対象の切替で前のフォーム入力とエラーを引き継がない", () => {
  const host = diagnostics.render(machine);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  const stateName = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(stateName, "with space");
  act(() => stateName.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("有効な状態名を入力してください");

  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "遷移") ?? null);
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

test("選択中の状態から遷移を追加すると遷移元が選ばれ、状態名を入力せずに追加できる", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click(host.querySelector('.state-machine-screen__node[aria-label^="待機"]'));
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "遷移") ?? null);
  const from = host.querySelector('select[aria-label="遷移元"]') as HTMLSelectElement;
  const to = host.querySelector('select[aria-label="遷移先"]') as HTMLSelectElement;
  expect(from.value).toBe("待機");
  expect([...from.options].map((option) => option.value)).toEqual(["待機"]);
  expect([...to.options].map((option) => option.value)).toEqual(["待機", "完了"]);
  act(() => { to.value = "待機"; to.dispatchEvent(new Event("change", { bubbles: true })); });
  const event = host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement;
  type(event, "再試行");
  act(() => event.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  transition: 待機 -> 待機 on 再試行");
});

test("追加した状態と遷移が選択され、インスペクターが編集フォームに切り替わる", async () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null);
  const name = host.querySelector('input[aria-label="状態名"]') as HTMLInputElement;
  type(name, "保留");
  act(() => name.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  state: 保留");
  const node = host.querySelector('.state-machine-screen__node[aria-label^="保留"]');
  expect(node?.getAttribute("data-selected")).toBe("true");
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("インスペクター");
  expect((host.querySelector('input[aria-label="状態名"]') as HTMLInputElement).value).toBe("保留");
  expect([...host.querySelectorAll("button")].some((button) => button.textContent === "削除")).toBe(true);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(document.activeElement).toBe(node);

  click([...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "遷移") ?? null);
  const event = host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement;
  type(event, "保留");
  act(() => event.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  transition: 保留 -> 待機 on 保留");
  expect(host.querySelector(".state-machine-screen__edge[data-selected='true']")?.textContent).toContain("保留");
  expect((host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement).value).toBe("保留");
});

test("状態のインスペクターから出入りする遷移を選び、その状態を起点に遷移を追加できる", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  click(host.querySelector('.state-machine-screen__node[aria-label^="完了"]'));
  const section = (title: string) => host.querySelector(`.state-machine-screen__transitions section[aria-label="${title}"]`);
  expect(section("出ていく遷移")?.textContent).toContain("なし");
  expect([...section("入ってくる遷移")?.querySelectorAll("button") ?? []].map((button) => button.textContent)).toEqual(["確定 ← 待機"]);
  expect([...host.querySelectorAll("button")].some((button) => button.textContent === "この状態から遷移を追加")).toBe(false);

  click(host.querySelector('.state-machine-screen__node[aria-label^="待機"]'));
  click(section("出ていく遷移")?.querySelector("button") ?? null);
  expect(host.querySelector(".state-machine-screen__edge[data-selected='true']")?.textContent).toContain("確定");
  expect((host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement).value).toBe("確定");

  click(host.querySelector('.state-machine-screen__node[aria-label^="待機"]'));
  click([...host.querySelectorAll("button")].find((button) => button.textContent === "この状態から遷移を追加") ?? null);
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("遷移を追加");
  expect((host.querySelector('select[aria-label="遷移元"]') as HTMLSelectElement).value).toBe("待機");
  const event = host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement;
  type(event, "保留");
  act(() => event.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  transition: 待機 -> 完了 on 保留");
});

const pointer = (type: string, target: Element | null, x: number, y: number) => {
  act(() => target?.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y })));
};

test("接続ハンドルから状態へドラッグすると遷移元・遷移先を入力済みの追加フォームを開く", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  expect(host.querySelector('.state-machine-screen__node[aria-label^="完了"] .state-machine-screen__handle')).toBeNull();
  const waiting = host.querySelector('.state-machine-screen__node[aria-label^="待機"]');
  const handle = waiting?.querySelector(".state-machine-screen__handle") ?? null;
  const done = host.querySelector('.state-machine-screen__node[aria-label^="完了"] rect');
  pointer("pointerdown", handle, 0, 0);
  pointer("pointermove", done, 300, 0);
  expect(host.querySelector(".state-machine-screen__connection")).not.toBeNull();
  expect(host.querySelector('.state-machine-screen__node[data-drop-target="true"]')?.getAttribute("aria-label")).toMatch(/^完了/);
  pointer("pointerup", done, 300, 0);
  click(host.querySelector(".state-machine-screen__graph"));
  expect(host.querySelector(".state-machine-screen__connection")).toBeNull();
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("遷移を追加");
  expect((host.querySelector('select[aria-label="遷移元"]') as HTMLSelectElement).value).toBe("待機");
  expect((host.querySelector('select[aria-label="遷移先"]') as HTMLSelectElement).value).toBe("完了");
  const event = host.querySelector('input[aria-label="イベント名"]') as HTMLInputElement;
  expect(document.activeElement).toBe(event);
  type(event, "保留");
  act(() => event.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(latest).toContain("  transition: 待機 -> 完了 on 保留");
});

test("自分自身へのドロップで自己ループを指定し、状態以外へのドロップと Escape ではキャンセルする", () => {
  const host = diagnostics.render(machine);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const waiting = host.querySelector('.state-machine-screen__node[aria-label^="待機"]');
  const handle = waiting?.querySelector(".state-machine-screen__handle") ?? null;
  const graph = host.querySelector(".state-machine-screen__graph");

  pointer("pointerdown", handle, 0, 0);
  pointer("pointermove", graph, 300, 300);
  pointer("pointerup", graph, 300, 300);
  expect(host.querySelector(".state-machine-screen__connection")).toBeNull();
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("インスペクター");

  pointer("pointerdown", handle, 0, 0);
  pointer("pointermove", graph, 300, 300);
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(host.querySelector(".state-machine-screen__connection")).toBeNull();
  pointer("pointerup", waiting, 0, 0);
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("インスペクター");

  pointer("pointerdown", handle, 0, 0);
  pointer("pointermove", waiting, 40, 40);
  pointer("pointerup", waiting?.querySelector("rect") ?? null, 40, 40);
  click(waiting);
  expect(host.querySelector(".state-machine-screen__inspector h2")?.textContent).toBe("遷移を追加");
  expect((host.querySelector('select[aria-label="遷移元"]') as HTMLSelectElement).value).toBe("待機");
  expect((host.querySelector('select[aria-label="遷移先"]') as HTMLSelectElement).value).toBe("待機");
});

const key = (target: Element | null, value: string, init: KeyboardEventInit = {}) => {
  act(() => target?.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...init })));
};

test("グラフの空白クリックと Escape で選択とパーツの追加を解除し、入力中の Escape は奪わない", () => {
  const host = diagnostics.render(machine);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const heading = () => host.querySelector(".state-machine-screen__inspector h2")?.textContent;
  const node = host.querySelector('.state-machine-screen__node[aria-label^="待機"]');
  click(node);
  expect(node?.getAttribute("data-selected")).toBe("true");
  click(host.querySelector(".state-machine-screen__graph"));
  expect(host.querySelector('[data-selected="true"]')).toBeNull();
  expect(document.activeElement).toBe(host.querySelector(".state-machine-screen__graph"));

  click(node);
  key(node, "Escape");
  expect(host.querySelector('[data-selected="true"]')).toBeNull();

  const statePart = [...host.querySelectorAll(".state-machine-screen__palette button")].find((button) => button.textContent === "状態") ?? null;
  click(statePart);
  expect(heading()).toBe("状態を追加");
  key(host.querySelector('input[aria-label="状態名"]'), "Escape");
  expect(heading()).toBe("状態を追加");
  key(statePart, "Escape");
  expect(heading()).toBe("インスペクター");
});

test("グラフ上の Delete / Backspace で選択中の状態・遷移を削除し、Undo で戻せる", () => {
  let latest = machine;
  const host = diagnostics.render(machine, (value) => { latest = value; });
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const graph = () => host.querySelector(".state-machine-screen__graph");

  const edge = host.querySelector(".state-machine-screen__edge");
  click(edge);
  key(host.querySelector('input[aria-label="イベント名"]'), "Backspace");
  expect(latest).toBe(machine);
  key(edge, "Backspace");
  expect(latest).not.toContain("transition: 待機 -> 完了 on 確定");
  expect(host.querySelectorAll(".state-machine-screen__edge")).toHaveLength(0);
  expect(document.activeElement).toBe(graph());
  key(graph(), "z", { ctrlKey: true });
  expect(latest).toBe(machine);

  const done = host.querySelector('.state-machine-screen__node[aria-label^="完了"]');
  click(done);
  key(done, "Delete");
  expect(latest).not.toContain("完了");
  expect(host.querySelectorAll(".state-machine-screen__node")).toHaveLength(1);
  expect(host.querySelector('[data-selected="true"]')).toBeNull();
  key(graph(), "Delete");
  expect(host.querySelectorAll(".state-machine-screen__node")).toHaveLength(1);
});

const viewBoxOf = (host: HTMLElement) =>
  (host.querySelector(".state-machine-screen__graph")?.getAttribute("viewBox") ?? "").split(/\s+/).map(Number);

test("空白のドラッグでパンし、ホイールでスクロール、Ctrl+ホイールで拡大縮小する", () => {
  const host = diagnostics.render(machine);
  click([...host.querySelectorAll("nav button")].find((button) => button.textContent === "ステートマシン") ?? null);
  const graph = host.querySelector(".state-machine-screen__graph");
  const zoom = () => host.querySelector('output[aria-label="現在の倍率"]')?.textContent;
  const node = host.querySelector('.state-machine-screen__node[aria-label^="待機"]');
  click(node);
  const [x, y, width] = viewBoxOf(host);
  expect(zoom()).toBe("100%");

  pointer("pointerdown", graph, 100, 100);
  pointer("pointermove", graph, 60, 70);
  expect(graph?.getAttribute("data-panning")).toBe("true");
  pointer("pointerup", graph, 60, 70);
  click(graph);
  expect(viewBoxOf(host).slice(0, 2)).toEqual([(x ?? 0) + 40, (y ?? 0) + 30]);
  expect(node?.getAttribute("data-selected")).toBe("true");

  pointer("pointerdown", graph, 10, 10);
  pointer("pointerup", graph, 10, 10);
  click(graph);
  expect(host.querySelector('[data-selected="true"]')).toBeNull();

  act(() => graph?.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaX: 5, deltaY: 10 })));
  expect(viewBoxOf(host).slice(0, 2)).toEqual([(x ?? 0) + 45, (y ?? 0) + 40]);
  const zoomIn = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -200, ctrlKey: true });
  Object.defineProperty(zoomIn, "ctrlKey", { value: true });
  act(() => graph?.dispatchEvent(zoomIn));
  expect(zoomIn.defaultPrevented).toBe(true);
  expect(Number(zoom()?.replace("%", ""))).toBeGreaterThan(100);
  expect(viewBoxOf(host)[2]).toBeLessThan(width ?? 0);

  click([...host.querySelectorAll(".state-machine-screen__zoom button")].find((button) => button.textContent === "フィット") ?? null);
  expect(zoom()).toBe("100%");
  expect(viewBoxOf(host).slice(0, 3)).toEqual([x, y, width]);
});
