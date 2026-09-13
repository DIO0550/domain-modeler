import { expect, test } from "vitest";
import { Option } from "../../option";
import { Identifier } from "..";

test("空文字は変換対象外になる", () => {
  expect(Identifier.create("")).toEqual(Option.none());
});

test("空文字は識別子列から除外される", () => {
  expect(Identifier.unify(["", "注文", ""])).toEqual(["注文"]);
});

test("空文字だけの列は空の識別子列になる", () => {
  expect(Identifier.unify(["", ""])).toEqual([]);
});

test.each(["1st", "A=B", "注文/確定"])(
  "識別子として使えない %s は変換対象外になる",
  (text: string) => {
    expect(Identifier.create(text)).toEqual(Option.none());
  },
);

test("識別子として使えないテキストは識別子列から除外される", () => {
  expect(Identifier.unify(["1st", "注文", "A=B"])).toEqual(["注文"]);
});

test.each([
  { text: "   ", expected: "___" },
  { text: "\n", expected: "_" },
  { text: " \t\n ", expected: "____" },
])(
  "空白のみのテキストは空文字ではなく $expected になる",
  ({ text, expected }: { text: string; expected: string }) => {
    expect(Identifier.create(text)).toEqual(Option.some(expected));
  },
);

test("連続する空白はそれぞれアンダースコアに置換される", () => {
  expect(Identifier.create("注文  確定")).toEqual(Option.some("注文__確定"));
});

test("全角空白もアンダースコアに置換される", () => {
  expect(Identifier.create("注文\u3000確定")).toEqual(
    Option.some("注文_確定"),
  );
});

test("空白置換後が予約語でなければ suffix は付かない", () => {
  expect(Identifier.create("da ta")).toEqual(Option.some("da_ta"));
});

test.each(["constructor", "toString"])(
  "Object.prototype のキー %s は予約語として suffix しない",
  (text: string) => {
    expect(Identifier.create(text)).toEqual(Option.some(text));
  },
);

test("同一の予約語テキストは1つの識別子に統合される", () => {
  expect(Identifier.unify(["data", "data"])).toEqual(["data_"]);
});

test("先に現れたテキストの順を保って統合する", () => {
  expect(Identifier.unify(["顧客", "注文", "顧客", "注文"])).toEqual([
    "顧客",
    "注文",
  ]);
});

test("unify は元の配列を変更しない", () => {
  const texts = ["注文", "注文", ""];
  Identifier.unify(texts);
  expect(texts).toEqual(["注文", "注文", ""]);
});
