import { expect, test } from "vitest";
import { ErrorDecl, Parse, SourceRange } from "@domain-modeler/model-core";
import { PreviewErrorPlaceholder } from "..";

test("壊れた宣言は開始行とパースエラーメッセージのプレースホルダになる", () => {
  const source = "data 数量 = int constrained 10..1";
  const parsed = Parse.parse(source);
  const decl = parsed.document.declarations[0];

  expect(decl?.kind).toBe("error");
  expect(
    PreviewErrorPlaceholder.create(
      ErrorDecl.create(decl?.range ?? SourceRange.onLine(1, 1, 1)),
      parsed.diagnostics,
    ),
  ).toEqual({
    startLine: 1,
    messages: ["範囲の下限が上限を超えています"],
  });
});

test("複数行の壊れた宣言は開始行をプレースホルダに使う", () => {
  const source = `data 数量 = int constrained 10..1
ゴミ行
data 注文ID = string`;
  const parsed = Parse.parse(source);
  const decl = parsed.document.declarations[0];

  expect(decl?.kind).toBe("error");
  expect(
    PreviewErrorPlaceholder.create(
      ErrorDecl.create(decl?.range ?? SourceRange.onLine(1, 1, 1)),
      parsed.diagnostics,
    ),
  ).toEqual({
    startLine: 1,
    messages: ["範囲の下限が上限を超えています"],
  });
});
