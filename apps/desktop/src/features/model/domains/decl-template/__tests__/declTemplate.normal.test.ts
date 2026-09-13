import { expect, test } from "vitest";
import { DeclTemplate } from "..";

test("data 雛形は名前部分の範囲を持つ", () => {
  const template = DeclTemplate.data();

  expect(template.kind).toBe("data");
  expect(template.source).toBe("data 名前 = string");
  expect(template.source.slice(template.nameStart, template.nameEnd)).toBe(
    "名前",
  );
});

test("workflow 雛形は input と output を持ち名前部分の範囲を持つ", () => {
  const template = DeclTemplate.workflow();

  expect(template.kind).toBe("workflow");
  expect(template.source).toBe(
    "workflow 名前 =\n  input: string\n  output: string",
  );
  expect(template.source.slice(template.nameStart, template.nameEnd)).toBe(
    "名前",
  );
});

test("空文書の先頭へ data 雛形を挿入し名前を選択する", () => {
  const template = DeclTemplate.data();

  expect(DeclTemplate.insert(template, { source: "", start: 0, end: 0 })).toEqual({
    edit: { start: 0, end: 0, replacement: "data 名前 = string" },
    nameStart: template.nameStart,
    nameEnd: template.nameEnd,
    line: 1,
  });
});

test("行末へ挿入するときは改行してから雛形を置く", () => {
  const source = "data 注文ID = string";
  const template = DeclTemplate.data();
  const caret = source.length;

  expect(
    DeclTemplate.insert(template, { source, start: caret, end: caret }),
  ).toEqual({
    edit: {
      start: caret,
      end: caret,
      replacement: "\ndata 名前 = string",
    },
    nameStart: caret + 1 + template.nameStart,
    nameEnd: caret + 1 + template.nameEnd,
    line: 2,
  });
});

test("workflow 雛形をカーソル位置へ挿入し名前を選択する", () => {
  const source = "data 注文ID = string\n";
  const template = DeclTemplate.workflow();
  const caret = source.length;

  expect(
    DeclTemplate.insert(template, { source, start: caret, end: caret }),
  ).toEqual({
    edit: {
      start: caret,
      end: caret,
      replacement: template.source,
    },
    nameStart: caret + template.nameStart,
    nameEnd: caret + template.nameEnd,
    line: 2,
  });
});
