import { expect, test } from "vitest";
import { StubInsertion } from "..";

test("識別子として使えない名前は失敗する", () => {
  expect(
    StubInsertion.atDocumentEnd({ source: "data 注文 = data", name: "data" }),
  ).toEqual({
    ok: false,
    error: "invalid_identifier",
  });
});

test("CRLF 末尾なら追加の改行を挟まない", () => {
  const source = "data 注文 = 未定義型\r\n";
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
