import { expect, test } from "vitest";
import { RESERVED_WORDS, ReservedWord } from "..";

test.each(Object.values(RESERVED_WORDS))(
  "予約語 %s は ReservedWord.is で真になる",
  (word: string) => {
    expect(ReservedWord.is(word)).toBe(true);
  },
);

test.each(["注文", "string", "input", "Data", "and", ""])(
  "予約語でない %s は ReservedWord.is で偽になる",
  (word: string) => {
    expect(ReservedWord.is(word)).toBe(false);
  },
);

test.each([
  { text: "data ", expected: 4 },
  { text: "workflow=", expected: 8 },
  { text: "AND", expected: 3 },
  { text: "OR ", expected: 2 },
  { text: "list", expected: 4 },
  { text: "option", expected: 6 },
  { text: "constrained", expected: 11 },
  { text: "length", expected: 6 },
  { text: "input: 注文", expected: 6 },
  { text: "output:", expected: 7 },
  { text: "error:検証", expected: 6 },
])(
  "先頭が予約語のとき matchedLength('$text') は $expected になる",
  ({ text, expected }: { text: string; expected: number }) => {
    expect(ReservedWord.matchedLength(text)).toBe(expected);
  },
);

test.each(["注文", "string", "input", "dataX", "ANDOR", ""])(
  "先頭が予約語でないとき matchedLength(%s) は 0 になる",
  (text: string) => {
    expect(ReservedWord.matchedLength(text)).toBe(0);
  },
);

test("input 単体はコロンがないため予約語として一致しない", () => {
  expect(ReservedWord.matchedLength("input 注文")).toBe(0);
  expect(ReservedWord.is("input")).toBe(false);
});
