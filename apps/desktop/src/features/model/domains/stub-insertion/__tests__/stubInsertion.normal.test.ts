import { expect, test } from "vitest";
import { StubInsertion } from "..";

test("文書末尾に改行が無ければ改行付きでスタブを追記する", () => {
  const source = "data 注文 = 未定義型";
  const insertion = StubInsertion.atDocumentEnd({
    source,
    name: "未定義型",
  });

  expect(insertion).toEqual({
    ok: true,
    value: {
      edit: {
        start: source.length,
        end: source.length,
        replacement: "\ndata 未定義型 = string // TODO 詳細化",
      },
      caret: {
        offset: source.length + 1,
        line: 2,
      },
    },
  });
});

test("末尾が改行ならスタブだけを追記する", () => {
  const source = "data 注文 = 未定義型\n";
  const insertion = StubInsertion.atDocumentEnd({
    source,
    name: "未定義型",
  });

  expect(insertion).toEqual({
    ok: true,
    value: {
      edit: {
        start: source.length,
        end: source.length,
        replacement: "data 未定義型 = string // TODO 詳細化",
      },
      caret: {
        offset: source.length,
        line: 2,
      },
    },
  });
});

test("空文書なら先頭へスタブを置く", () => {
  const insertion = StubInsertion.atDocumentEnd({
    source: "",
    name: "注文",
  });

  expect(insertion).toEqual({
    ok: true,
    value: {
      edit: {
        start: 0,
        end: 0,
        replacement: "data 注文 = string // TODO 詳細化",
      },
      caret: { offset: 0, line: 1 },
    },
  });
});
