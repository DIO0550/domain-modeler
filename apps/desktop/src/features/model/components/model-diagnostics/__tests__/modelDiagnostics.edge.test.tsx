import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { ModelDiagnostics } from "../index";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const diagnostics = createDiagnosticsRenderer();

afterEach(() => {
  diagnostics.unmountAll();
});

test("空文書は診断装飾もプレビュー項目も出さない", () => {
  const host = diagnostics.render("");

  expect(host.querySelector(".model-editor__diagnostics-line--error")).toBeNull();
  expect(host.querySelector(".preview-error-placeholder")).toBeNull();
  expect(host.querySelector(".preview-data-card")).toBeNull();
});

test("workflow の未定義参照もプレビューに未定義バッジを出す", () => {
  const host = diagnostics.render(`workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント`);

  expect(host.querySelector(".model-editor__diagnostics-line--error")).toBeNull();
  expect(
    Array.from(
      host.querySelectorAll(".preview-workflow-card__undefined-badge"),
    ).map((badge) => badge.textContent),
  ).toEqual(["未定義", "未定義"]);
});

test("後方の定義をクリックするとその宣言行へジャンプする", () => {
  const source = "data 注文 = 注文ID\ndata 注文ID = string";
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

  const offset = "data 注文 = 注文ID\n".length;
  expect([input.selectionStart, input.selectionEnd]).toEqual([offset, offset]);
});

test("未定義の型参照名をクリックしてもスタブを追記してその行へジャンプする", () => {
  const source = "data 注文 = 未定義型";
  const host = diagnostics.render(source);
  const nameButton = host.querySelector(
    "button.preview-data-card__type-name--undefined",
  );
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");

  act(() => {
    nameButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  const stubOffset = `${source}\n`.length;
  expect(input.value).toBe(
    `${source}\ndata 未定義型 = string // TODO 詳細化`,
  );
  expect([input.selectionStart, input.selectionEnd]).toEqual([
    stubOffset,
    stubOffset,
  ]);
});

test("IME変換中に親の全文が変わってもプレビューは表示中のテキストに従う", () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const render = (value: string) => {
    act(() => {
      root.render(
        <ModelDiagnostics value={value} onChange={() => undefined} />,
      );
    });
  };

  render("data 注文ID = string");
  const found = host.querySelector("textarea");
  const input =
    found instanceof HTMLTextAreaElement
      ? found
      : document.createElement("textarea");
  act(() => {
    input.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
  });
  render("data 別 = 未定義型");

  expect(input.value).toBe("data 注文ID = string");
  expect(
    host.querySelector(".preview-data-card")?.getAttribute("data-decl-name"),
  ).toBe("注文ID");
  expect(host.querySelector(".preview-data-card__undefined-badge")).toBeNull();

  act(() => {
    root.unmount();
  });
  host.remove();
});
