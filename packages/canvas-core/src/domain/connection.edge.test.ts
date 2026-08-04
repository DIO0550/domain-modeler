import { expect, test } from "vitest";
import { Connection } from "./connection";

test("21文字のテキストは先頭20文字に切り詰める", () => {
  const twentyOne = "あいうえおかきくけこさしすせそたちつてとな";
  const note = Connection.buildNote(twentyOne, "b");

  expect(note.split(" -> ")[0]).toHaveLength(20);
  expect(note).toBe("あいうえおかきくけこさしすせそたちつてと -> b");
});

test.each([
  { text: "a\nb", expected: "a b" },
  { text: "a\r\nb", expected: "a b" },
  { text: "a\rb", expected: "a b" },
  { text: "a\n\nb", expected: "a  b" },
])(
  "改行を含むテキストはスペースに置換してから note に使う ($text)",
  ({ text, expected }: { text: string; expected: string }) => {
    expect(Connection.buildNote(text, "x")).toBe(`${expected} -> x`);
  },
);
