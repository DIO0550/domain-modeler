import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const diagnostics = createDiagnosticsRenderer();

afterEach(() => diagnostics.unmountAll());

const click = (element: Element | null) => {
  act(() => element?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
};

const source = `data 注文ID = string
state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
state-machine 返金 =
  initial: 申請
  state: 申請
  state: 済 terminal
  transition: 申請 -> 済 on 承認`;

const openRefund = (host: HTMLElement) => {
  click(host.querySelector('[data-decl-name="返金"] button'));

  expect(
    host
      .querySelector(".state-machine-screen__graph")
      ?.getAttribute("aria-label"),
  ).toBe("返金 の状態遷移図");
};

test("プレビューから2つ目の宣言を開き、モデルへ戻っても同じマシンを表示する", () => {
  const host = diagnostics.render(source);

  openRefund(host);
  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "モデルで開く",
    ) ?? null,
  );

  const input = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
    "返金",
  );
  expect(input.selectionStart).toBe(source.indexOf("返金"));

  click(
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "ステートマシン",
    ) ?? null,
  );

  expect(
    host
      .querySelector(".state-machine-screen__graph")
      ?.getAttribute("aria-label"),
  ).toBe("返金 の状態遷移図");
});

test("選択した状態と遷移の source range にジャンプする", () => {
  const host = diagnostics.render(source);

  openRefund(host);
  click(host.querySelector('.state-machine-screen__node[aria-label^="申請"]'));
  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "選択要素の DSL へ移動",
    ) ?? null,
  );

  let input = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
    "申請",
  );
  expect(input.selectionStart).toBe(
    source.indexOf("state: 申請") + "state: ".length,
  );

  click(
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "ステートマシン",
    ) ?? null,
  );
  click(host.querySelector(".state-machine-screen__edge"));
  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "選択要素の DSL へ移動",
    ) ?? null,
  );
  input = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
    "transition: 申請 -> 済 on 承認",
  );
});

test("通常のモード往復では caret と両ペインのスクロールを復元する", () => {
  const host = diagnostics.render(source);
  const input = host.querySelector("textarea") as HTMLTextAreaElement;
  const preview = host.querySelector(
    ".model-diagnostics__preview",
  ) as HTMLElement;

  act(() => {
    input.setSelectionRange(7, 7);
    input.scrollTop = 52;
    input.scrollLeft = 12;
    input.dispatchEvent(new Event("select", { bubbles: true }));
    preview.scrollTop = 38;
  });
  click(
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "ステートマシン",
    ) ?? null,
  );
  click(
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "モデル",
    ) ?? null,
  );

  const restored = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(restored.selectionStart).toBe(7);
  expect(restored.scrollTop).toBe(52);
  expect(restored.scrollLeft).toBe(12);
  expect(
    (host.querySelector(".model-diagnostics__preview") as HTMLElement)
      .scrollTop,
  ).toBe(38);
});

test("ステートマシン画面のタブを再度押してもモデル画面の位置を復元する", () => {
  const host = diagnostics.render(source);
  const input = host.querySelector("textarea") as HTMLTextAreaElement;
  const preview = host.querySelector(
    ".model-diagnostics__preview",
  ) as HTMLElement;

  act(() => {
    input.setSelectionRange(7, 7);
    input.scrollTop = 52;
    input.scrollLeft = 12;
    input.dispatchEvent(new Event("select", { bubbles: true }));
    preview.scrollTop = 38;
  });

  const stateMachineTab = () =>
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "ステートマシン",
    ) ?? null;

  click(stateMachineTab());
  click(stateMachineTab());
  click(
    [...host.querySelectorAll("nav button")].find(
      (button) => button.textContent === "モデル",
    ) ?? null,
  );

  const restored = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(restored.selectionStart).toBe(7);
  expect(restored.scrollTop).toBe(52);
  expect(restored.scrollLeft).toBe(12);
  expect(
    (host.querySelector(".model-diagnostics__preview") as HTMLElement)
      .scrollTop,
  ).toBe(38);
});

test("未保存の診断付き宣言でも現在のテキストからジャンプする", () => {
  const current = "state-machine 作業 =\n  state: 保留";
  const host = diagnostics.render(current);

  click(host.querySelector('[data-decl-name="作業"] button'));
  click(host.querySelector('.state-machine-screen__node[aria-label^="保留"]'));
  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "選択要素の DSL へ移動",
    ) ?? null,
  );

  const input = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(input.value).toBe(current);
  expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
    "保留",
  );
});

test("同名の宣言はプレビューで指定した出現位置を開く", () => {
  const duplicate =
    "state-machine 同名 =\n  state: 一\nstate-machine 同名 =\n  state: 二";
  const host = diagnostics.render(duplicate);

  click(host.querySelectorAll('[data-decl-name="同名"] button')[1] ?? null);

  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="二"]'),
  ).not.toBeNull();
  expect(
    host.querySelector('.state-machine-screen__node[aria-label^="一"]'),
  ).toBeNull();

  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "モデルで開く",
    ) ?? null,
  );

  expect(
    (host.querySelector("textarea") as HTMLTextAreaElement).selectionStart,
  ).toBe(duplicate.lastIndexOf("同名"));
});

test("CRLF の文書でも textarea の正規化後の位置へジャンプする", () => {
  const crlf = "data ID = string\r\nstate-machine 作業 =\r\n  state: 保留";
  const host = diagnostics.render(crlf);

  click(host.querySelector('[data-decl-name="作業"] button'));
  click(host.querySelector('.state-machine-screen__node[aria-label^="保留"]'));
  click(
    [...host.querySelectorAll("button")].find(
      (button) => button.textContent === "選択要素の DSL へ移動",
    ) ?? null,
  );

  const input = host.querySelector("textarea") as HTMLTextAreaElement;

  expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe(
    "保留",
  );
});
