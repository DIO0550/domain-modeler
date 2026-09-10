import { expect, test } from "vitest";
import { Diagnostic, SourceRange, Tokenizer } from "@domain-modeler/model-core";
import { Highlight } from "..";

test("宣言・結合・制約・入出力の予約語を強調色に分類する", () => {
  const tokens = Tokenizer.tokenize("data workflow AND OR constrained length input: output: error:");
  expect(Highlight.collect(tokens, [])).toEqual(
    tokens.map(({ range }) => ({ kind: "keyword", range })),
  );
});

test("全プリミティブ型と後置修飾を型色に分類する", () => {
  const tokens = Tokenizer.tokenize("string int decimal bool date datetime list option");
  expect(Highlight.collect(tokens, [])).toEqual(
    tokens.map(({ range }) => ({ kind: "primitive", range })),
  );
});

test("コメント内の予約語と型名はコメントとしてまとめる", () => {
  const tokens = Tokenizer.tokenize("// data string list");
  expect(Highlight.collect(tokens, [])).toEqual([
    { kind: "comment", range: SourceRange.onLine(1, 1, 20) },
  ]);
});

test("日本語とタブを含むCRLF入力でもトークンの位置を保持する", () => {
  const tokens = Tokenizer.tokenize("data 注文 = string\r\n\t// 注文\r\n\tint");
  expect(Highlight.collect(tokens, [])).toEqual([
    { kind: "keyword", range: SourceRange.onLine(1, 1, 5) },
    { kind: "primitive", range: SourceRange.onLine(1, 11, 17) },
    { kind: "comment", range: SourceRange.onLine(2, 2, 7) },
    { kind: "primitive", range: SourceRange.onLine(3, 2, 5) },
  ]);
});

test("診断は構文範囲と重なっても深刻度とメッセージを保持する", () => {
  const range = SourceRange.onLine(1, 1, 5);
  const diagnostics = [
    Diagnostic.create("error", "宣言が不完全です", range),
    Diagnostic.create("warning", "参照が未定義です", range),
  ];
  expect(Highlight.collect(Tokenizer.tokenize("data"), diagnostics)).toEqual([
    { kind: "keyword", range },
    { kind: "diagnostic", severity: "error", message: "宣言が不完全です", range },
    { kind: "diagnostic", severity: "warning", message: "参照が未定義です", range },
  ]);
});
