import { expect, test } from "vitest";
import { RESERVED_WORDS } from "../../reserved-word";
import { Identifier } from "..";

test.each(["注文", "注文ID", "未検証の注文", "string", "int", "customer_name"])(
  "識別子として使える %s は isAcceptable が真になる",
  (text: string) => {
    expect(Identifier.isAcceptable(text)).toBe(true);
  },
);

test.each(Object.values(RESERVED_WORDS))(
  "予約語 %s は識別子として拒否される",
  (word: string) => {
    expect(Identifier.isAcceptable(word)).toBe(false);
  },
);
