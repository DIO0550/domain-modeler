import { afterEach, expect, test } from "vitest";
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
