import { afterEach, expect, test } from "vitest";
import { Diagnostic, Parse, SourceRange } from "@domain-modeler/model-core";
import {
  createPlaceholderRenderer,
  firstErrorDecl,
} from "./previewErrorPlaceholder.test-support";

const placeholders = createPlaceholderRenderer();

afterEach(() => {
  placeholders.unmountAll();
});

test("重なる診断が無いときは行番号だけを表示する", () => {
  const parsed = Parse.parse("data 数量 = int constrained 10..1");
  const host = placeholders.render(firstErrorDecl(parsed), []);

  expect(
    host.querySelector(".preview-error-placeholder__line")?.textContent,
  ).toBe("1行目");
  expect(host.querySelector(".preview-error-placeholder__message")).toBeNull();
});

test("警告はプレースホルダのメッセージに出さない", () => {
  const parsed = Parse.parse("data 数量 = int constrained 10..1");
  const host = placeholders.render(firstErrorDecl(parsed), [
    ...parsed.diagnostics,
    Diagnostic.create(
      "warning",
      "「未定義型」は未定義です",
      SourceRange.onLine(1, 11, 15),
    ),
  ]);

  expect(
    Array.from(
      host.querySelectorAll(".preview-error-placeholder__message"),
    ).map((node) => node.textContent),
  ).toEqual(["範囲の下限が上限を超えています"]);
});
