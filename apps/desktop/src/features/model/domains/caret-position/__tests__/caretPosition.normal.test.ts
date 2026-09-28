import { expect, test } from "vitest";
import { SourceRange } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { CaretPosition } from "..";

test("1行目の先頭はオフセット 0 になる", () => {
  expect(
    CaretPosition.fromRange("data 注文 = string", SourceRange.onLine(1, 1, 1)),
  ).toEqual(Option.some({ offset: 0, line: 1 }));
});

test("行と桁からも同じオフセットになる", () => {
  const source = "data 注文 = string";

  expect(CaretPosition.fromLineColumn(source, 1, 6)).toEqual(
    Option.some({ offset: 5, line: 1 }),
  );
});

test("同一行の桁は先頭からの文字数になる", () => {
  const source = "data 注文 = string";

  expect(CaretPosition.fromRange(source, SourceRange.onLine(1, 6, 8))).toEqual(
    Option.some({ offset: 5, line: 1 }),
  );
});

test("LF の次行先頭は改行の直後になる", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";

  expect(CaretPosition.fromRange(source, SourceRange.onLine(2, 1, 1))).toEqual(
    Option.some({
      offset: "data 注文ID = string\n".length,
      line: 2,
    }),
  );
});

test("オフセットから行番号を復元する", () => {
  const source = "data 注文ID = string\ndata 注文 = 注文ID";
  const offset = "data 注文ID = string\n".length;

  expect(CaretPosition.atOffset(source, offset)).toEqual({
    offset,
    line: 2,
  });
});

test("範囲が文書外なら値なしになる", () => {
  expect(
    CaretPosition.fromRange("data 注文 = string", SourceRange.onLine(3, 1, 1)),
  ).toEqual(Option.none());
});

test("複数行にまたがる範囲は開始行と両端の桁を選択範囲へ変換する", () => {
  const source = "abc\ndef";
  const range = SourceRange.span(
    SourceRange.onLine(1, 2, 2),
    SourceRange.onLine(2, 2, 4),
  );

  expect(CaretPosition.selectionFromRange(source, range)).toEqual(
    Option.some({ start: 1, end: 7, line: 1 }),
  );
});
