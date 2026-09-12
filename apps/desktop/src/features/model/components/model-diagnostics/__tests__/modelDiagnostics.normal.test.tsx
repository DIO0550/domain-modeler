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
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    badge?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const stubLine = "data 未定義型 = string // TODO 詳細化";
  const expected = `${source}\n${stubLine}`;
  const stubOffset = `${source}\n`.length;

  expect(input.value).toBe(expected);
  expect([input.selectionStart, input.selectionEnd]).toEqual([
    stubOffset,
    stubOffset,
  ]);
  expect(
    host.querySelector('[data-decl-name="未定義型"]'),
  ).not.toBeNull();
});
