import { expect, test } from "vitest";
import {
  Diagnostic,
  ErrorDecl,
  Parse,
  SourceRange,
} from "@domain-modeler/model-core";
import { PreviewErrorPlaceholder } from "..";

test("宣言範囲に重ならない診断はプレースホルダに載せない", () => {
  const decl = ErrorDecl.create(SourceRange.onLine(1, 1, 8));
  const placeholder = PreviewErrorPlaceholder.create(decl, [
    Diagnostic.create(
      "error",
      "別の行のエラー",
      SourceRange.onLine(3, 1, 4),
    ),
  ]);

  expect(placeholder).toEqual({
    startLine: 1,
    messages: [],
  });
});

test("同じ壊れた宣言の複数エラーは出現順のメッセージを集める", () => {
  const range = SourceRange.span(
    SourceRange.onLine(1, 1, 8),
    SourceRange.onLine(2, 1, 4),
  );
  const placeholder = PreviewErrorPlaceholder.create(ErrorDecl.create(range), [
    Diagnostic.create("error", "宣言の形が不正です", SourceRange.onLine(1, 1, 5)),
    Diagnostic.create("warning", "参照が未定義です", SourceRange.onLine(1, 6, 8)),
    Diagnostic.create("error", "識別子が必要です", SourceRange.onLine(2, 1, 4)),
  ]);

  expect(placeholder).toEqual({
    startLine: 1,
    messages: ["宣言の形が不正です", "識別子が必要です"],
  });
});

test("後続の正しい宣言の診断は壊れた宣言のプレースホルダに混ぜない", () => {
  const source = `data 数量 = int constrained 10..1
data 注文 = 未定義型`;
  const parsed = Parse.parse(source);
  const decl = parsed.document.declarations[0];

  expect(decl?.kind).toBe("error");
  expect(
    PreviewErrorPlaceholder.create(
      ErrorDecl.create(decl?.range ?? SourceRange.onLine(1, 1, 1)),
      parsed.diagnostics,
    ).messages,
  ).toEqual(["範囲の下限が上限を超えています"]);
});
