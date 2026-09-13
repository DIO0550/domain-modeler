import { expect, test } from "vitest";
import { DeclTemplate } from "..";

test("行の途中へ挿入するときは前後を改行で区切る", () => {
  const source = "data 注文ID = string";
  const template = DeclTemplate.data();
  const caret = "data ".length;

  expect(
    DeclTemplate.insert(template, { source, start: caret, end: caret }),
  ).toEqual({
    edit: {
      start: caret,
      end: caret,
      replacement: "\ndata 名前 = string\n",
    },
    nameStart: caret + 1 + template.nameStart,
    nameEnd: caret + 1 + template.nameEnd,
    line: 2,
  });
});

test("選択範囲があるときはその範囲を雛形へ置き換える", () => {
  const source = "data 注文ID = string";
  const template = DeclTemplate.data();
  const start = source.indexOf("注文ID");
  const end = start + "注文ID".length;

  expect(DeclTemplate.insert(template, { source, start, end })).toEqual({
    edit: {
      start,
      end,
      replacement: "\ndata 名前 = string\n",
    },
    nameStart: start + 1 + template.nameStart,
    nameEnd: start + 1 + template.nameEnd,
    line: 2,
  });
});

test("末尾が改行なら追加の改行を挟まない", () => {
  const source = "data 注文ID = string\n";
  const template = DeclTemplate.data();
  const caret = source.length;

  expect(
    DeclTemplate.insert(template, { source, start: caret, end: caret }),
  ).toEqual({
    edit: {
      start: caret,
      end: caret,
      replacement: "data 名前 = string",
    },
    nameStart: caret + template.nameStart,
    nameEnd: caret + template.nameEnd,
    line: 2,
  });
});
