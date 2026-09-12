import { afterEach, expect, test } from "vitest";
import { Parse } from "@domain-modeler/model-core";
import {
  createPlaceholderRenderer,
  firstErrorDecl,
} from "./previewErrorPlaceholder.test-support";

const placeholders = createPlaceholderRenderer();

afterEach(() => {
  placeholders.unmountAll();
});

test("壊れた宣言は行番号とパースエラーメッセージを表示する", () => {
  const parsed = Parse.parse("data 数量 = int constrained 10..1");
  const host = placeholders.render(
    firstErrorDecl(parsed),
    parsed.diagnostics,
  );

  expect(host.querySelector("article")?.getAttribute("data-preview-kind")).toBe(
    "error",
  );
  expect(
    host.querySelector(".preview-error-placeholder__line")?.textContent,
  ).toBe("1行目");
  expect(
    host.querySelector(".preview-error-placeholder__message")?.textContent,
  ).toBe("範囲の下限が上限を超えています");
});

test("後続の正しい宣言があっても壊れた宣言のメッセージだけを出す", () => {
  const parsed = Parse.parse(`data 数量 = int constrained 10..1
data 注文ID = string`);
  const host = placeholders.render(
    firstErrorDecl(parsed),
    parsed.diagnostics,
  );

  expect(
    host.querySelector(".preview-error-placeholder__message")?.textContent,
  ).toBe("範囲の下限が上限を超えています");
  expect(host.querySelectorAll(".preview-error-placeholder__message")).toHaveLength(
    1,
  );
});
