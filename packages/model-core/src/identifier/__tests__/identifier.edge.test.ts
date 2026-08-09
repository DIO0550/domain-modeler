import { expect, test } from "vitest";
import { Identifier } from "..";

test("空文字は識別子として拒否される", () => {
  expect(Identifier.isAcceptable("")).toBe(false);
});

test.each(["注文 名", "注文\n名", "注文\t名", " 注文", "注文 "])(
  "空白を含む %s は識別子として拒否される",
  (text: string) => {
    expect(Identifier.isAcceptable(text)).toBe(false);
  },
);

test("コロンなしの input は予約語ではないが識別子として使える", () => {
  expect(Identifier.isAcceptable("input")).toBe(true);
});
