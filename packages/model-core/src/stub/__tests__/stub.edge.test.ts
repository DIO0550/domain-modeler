import { expect, test } from "vitest";
import { RESERVED_WORDS, Stub } from "../..";

test("空文字からスタブを生成すると失敗する", () => {
  expect(Stub.generate("")).toEqual({
    ok: false,
    error: "invalid_identifier",
  });
});

test.each(["注文 名", "注文\n名", "注文\t名", " 注文", "注文 "])(
  "空白を含む %s からスタブを生成すると失敗する",
  (name: string) => {
    expect(Stub.generate(name)).toEqual({
      ok: false,
      error: "invalid_identifier",
    });
  },
);

test.each(Object.values(RESERVED_WORDS))(
  "予約語 %s からスタブを生成すると失敗する",
  (name: string) => {
    expect(Stub.generate(name)).toEqual({
      ok: false,
      error: "invalid_identifier",
    });
  },
);
