import { expect, test } from "vitest";
import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "..";
import { SourceRange } from "../../source-range";

test("エラー診断を生成する", () => {
  const range = SourceRange.onLine(2, 1, 10);
  expect(
    Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "宣言の形が不正です", range),
  ).toEqual({
    severity: "error",
    message: "宣言の形が不正です",
    range,
  });
});

test("警告診断を生成する", () => {
  const range = SourceRange.onLine(5, 3, 8);
  expect(
    Diagnostic.create(
      DIAGNOSTIC_SEVERITIES.warning,
      "未定義の識別子です",
      range,
    ),
  ).toEqual({
    severity: "warning",
    message: "未定義の識別子です",
    range,
  });
});
