import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const diagnostics = createDiagnosticsRenderer();

afterEach(() => {
  diagnostics.unmountAll();
});

test("パースエラーはエディタの行末とプレビューのプレースホルダに赤で出る", () => {
  const host = diagnostics.render("data 数量 = int constrained 10..1");

  expect(
    host.querySelector(".model-editor__diagnostics-line--error"),
  ).not.toBeNull();
  expect(
    host.querySelector(".model-editor__diagnostics-message")?.textContent,
  ).toBe("範囲の下限が上限を超えています");
  expect(
    host.querySelector(".preview-error-placeholder__message")?.textContent,
  ).toBe("範囲の下限が上限を超えています");
});

test("未定義参照はエディタの点線下線とプレビューの未定義バッジで穏やかに出る", () => {
  const host = diagnostics.render("data 注文 = 未定義型");

  expect(host.querySelector(".model-editor__diagnostics-line--error")).toBeNull();
  expect(host.querySelector(".model-editor__diagnostics-message")).toBeNull();
  expect(
    host.querySelector(".model-editor__diagnostics-warning")?.textContent,
  ).toBe("未定義型");
  expect(
    host.querySelector(".preview-data-card__undefined-badge")?.textContent,
  ).toBe("未定義");
});

test("壊れた宣言の次の正しい宣言はカードとして残る", () => {
  const host = diagnostics.render(`data 数量 = int constrained 10..1
data 注文ID = string`);

  expect(host.querySelector(".preview-error-placeholder")).not.toBeNull();
  expect(
    host.querySelector(".preview-data-card")?.getAttribute("data-decl-name"),
  ).toBe("注文ID");
});

test("パースエラーがあっても入力内容を親へ反映する", () => {
  let latest = "data 注文ID = string";
  const host = diagnostics.render(latest, (text) => {
    latest = text;
  });
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data 注文 =\n");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  expect(latest).toBe("data 注文 =\n");
  expect(input.disabled).toBe(false);
});

test("定義済みの型参照をクリックすると宣言先頭へキャレットが移る", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";
  const host = diagnostics.render(source);
  const button = host.querySelector("button.preview-data-card__type-name");
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect([input.selectionStart, input.selectionEnd]).toEqual([0, 0]);
  expect(input.value).toBe(source);
});

test("未定義バッジをクリックすると末尾にスタブを追記してその行へジャンプする", () => {
  const source = "data 注文 = 未定義型";
  const host = diagnostics.render(source);
  const badge = host.querySelector(
    "button.preview-data-card__undefined-badge",
  );
  const badgeButton =
    badge instanceof HTMLButtonElement
      ? badge
      : document.createElement("button");
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    badgeButton.focus();
    badgeButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const stubLine = "data 未定義型 = string // TODO 詳細化";
  const expected = `${source}\n${stubLine}`;
  const stubOffset = `${source}\n`.length;

  expect(input.value).toBe(expected);
  expect(document.activeElement).toBe(input);
  expect([input.selectionStart, input.selectionEnd]).toEqual([
    stubOffset,
    stubOffset,
  ]);
  expect(
    host.querySelector('[data-decl-name="未定義型"]'),
  ).not.toBeNull();
});

test("カード名からリネームすると宣言名と参照を一括置換する", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";
  const host = diagnostics.render(source);
  const button = host.querySelector(
    'button[aria-label="「注文ID」をリネーム"]',
  );
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  const nameField = host.querySelector('input[aria-label="新しい名前"]');
  const nameInput =
    nameField instanceof HTMLInputElement
      ? nameField
      : document.createElement("input");
  act(() => {
    nameInput.focus();
    nameInput.value = "商品ID";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    nameInput.form?.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });

  expect(input.value).toBe("data 商品ID = string\ndata 注文 = 商品ID");
  expect(
    host.querySelector('[data-decl-name="商品ID"]'),
  ).not.toBeNull();
});

test("data雛形をカーソル位置へ挿入し名前部分を選択する", () => {
  const source = "data 注文ID = string";
  const host = diagnostics.render(source);
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");
  const insertButton = Array.from(host.querySelectorAll("button")).find(
    (button) => button.textContent === "data雛形",
  );

  act(() => {
    input.focus();
    input.setSelectionRange(source.length, source.length);
    insertButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const expected = `${source}\ndata 名前 = string`;
  const nameStart = `${source}\ndata `.length;
  const nameEnd = nameStart + "名前".length;

  expect(input.value).toBe(expected);
  expect([input.selectionStart, input.selectionEnd]).toEqual([
    nameStart,
    nameEnd,
  ]);
});
