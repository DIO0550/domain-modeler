import { expect, test } from "vitest";
import { SourceRange } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { CaretPosition } from "..";

test("CRLF の次行先頭は 2 文字の改行の直後になる", () => {
  const source = "data 注文 = string\r\n// 次行";

  expect(CaretPosition.fromRange(source, SourceRange.onLine(2, 1, 1))).toEqual(
    Option.some({
      offset: "data 注文 = string\r\n".length,
      line: 2,
    }),
  );
});

test("CR のみの次行先頭は 1 文字の改行の直後になる", () => {
  const source = "data 注文 = string\r// 次行";

  expect(CaretPosition.fromRange(source, SourceRange.onLine(2, 1, 1))).toEqual(
    Option.some({
      offset: "data 注文 = string\r".length,
      line: 2,
    }),
  );
});

test("空文書の先頭はオフセット 0 の 1 行目になる", () => {
  expect(CaretPosition.fromRange("", SourceRange.onLine(1, 1, 1))).toEqual(
    Option.some({ offset: 0, line: 1 }),
  );
});

test("末尾改行の空行先頭は最終行になる", () => {
  const source = "data 注文 = string\n";

  expect(CaretPosition.fromRange(source, SourceRange.onLine(2, 1, 1))).toEqual(
    Option.some({
      offset: source.length,
      line: 2,
    }),
  );
});
