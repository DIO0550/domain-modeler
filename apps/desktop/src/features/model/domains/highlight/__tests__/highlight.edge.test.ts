import { expect, test } from "vitest";
import { Diagnostic, SourceRange, Tokenizer } from "@domain-modeler/model-core";
import { Highlight } from "..";

test("識別子・数値・記号・空白は標準色としてハイライトしない", () => {
  const tokens = Tokenizer.tokenize("\t注文 = 1..100\n  \nstringValue dataValue List INT");
  expect(Highlight.collect(tokens, [])).toEqual([]);
});

test("空のソースに診断がなければハイライトはない", () => {
  expect(Highlight.collect(Tokenizer.tokenize(""), [])).toEqual([]);
});

test("複数行と末尾の空範囲の診断を切り詰めずに保持する", () => {
  const ranges = [
    { startLine: 1, startColumn: 3, endLine: 3, endColumn: 2 },
    SourceRange.onLine(4, 1, 1),
  ];
  const diagnostics = ranges.map((range) => Diagnostic.create("error", "構文エラー", range));
  expect(Highlight.collect([], diagnostics)).toEqual(
    diagnostics.map((diagnostic) => ({ ...diagnostic, kind: "diagnostic" })),
  );
});

test("補助平面の文字の後もUTF-16の桁位置を保持する", () => {
  expect(Highlight.collect(Tokenizer.tokenize("𠮷 = int"), [])).toEqual([
    { kind: "primitive", range: SourceRange.onLine(1, 6, 9) },
  ]);
});
