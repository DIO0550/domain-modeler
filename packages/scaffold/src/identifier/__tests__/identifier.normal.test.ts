import {
  Identifier as ModelIdentifier,
  RESERVED_WORDS,
} from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { Option } from "../../option";
import { Identifier } from "..";

test.each(["注文", "注文ID", "未検証の注文", "string", "customer_name"])(
  "日本語・英数字の付箋テキスト %s はそのまま識別子になる",
  (text: string) => {
    expect(Identifier.create(text)).toEqual(Option.some(text));
  },
);

test.each([
  { text: "注文 確定", expected: "注文_確定" },
  { text: "注文\n確定", expected: "注文_確定" },
  { text: "注文\t確定", expected: "注文_確定" },
  { text: " 注文", expected: "_注文" },
  { text: "注文 ", expected: "注文_" },
])(
  "空白・改行を含む '$text' はアンダースコアに置換される",
  ({ text, expected }: { text: string; expected: string }) => {
    expect(Identifier.create(text)).toEqual(Option.some(expected));
  },
);

test("予約語 data は末尾にアンダースコアが付く", () => {
  expect(Identifier.create("data")).toEqual(Option.some("data_"));
});

test.each([
  { text: "input:", expected: "input_:" },
  { text: "output:", expected: "output_:" },
  { text: "error:", expected: "error_:" },
])(
  "コロン付き予約語 $text は $expected になり識別子として使える",
  ({ text, expected }: { text: string; expected: string }) => {
    expect(Identifier.create(text)).toEqual(Option.some(expected));
  },
);

test.each(Object.values(RESERVED_WORDS))(
  "予約語 %s は予約語ではなく識別子として使える形になる",
  (word: string) => {
    const identifier = Option.unwrap(Identifier.create(word));
    expect(identifier).not.toBe(word);
    expect(ModelIdentifier.isAcceptable(identifier)).toBe(true);
  },
);

test("同一テキストの付箋は1つの識別子に統合される", () => {
  expect(Identifier.unify(["注文", "顧客", "注文"])).toEqual(["注文", "顧客"]);
});

test("日本語・予約語・空白混在のテキスト列を識別子化する", () => {
  const texts = ["注文確定", "data", "注文 確定", "input:"];
  const identifiers = Identifier.unify(texts);

  expect(identifiers).toEqual(["注文確定", "data_", "注文_確定", "input_:"]);
});
