import { expect, test } from "vitest";
import { Stub } from "../..";

test("日本語識別子から所定の data 宣言スタブが生成される", () => {
  expect(Stub.generate("注文")).toEqual({
    ok: true,
    value: "data 注文 = string // TODO 詳細化",
  });
});
