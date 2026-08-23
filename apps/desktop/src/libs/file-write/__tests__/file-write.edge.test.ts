import { expect, test } from "vitest";
import { writeFileAsResult } from "../index";

test("書き込みが例外を投げると失敗結果へ変換する", async () => {
  const result = await writeFileAsResult(
    async () => {
      throw new Error("disk full");
    },
    { path: "/documents/context.dcanvas", contents: "{}" },
  );

  expect(result).toEqual({
    type: "err",
    error: {
      kind: "writeFailed",
      path: "/documents/context.dcanvas",
      message: "disk full",
    },
  });
});

test("Error 以外の例外も失敗メッセージへ変換する", async () => {
  const result = await writeFileAsResult(
    async () => {
      throw "unavailable";
    },
    { path: "/documents/order.dmodel", contents: "" },
  );

  expect(result).toEqual({
    type: "err",
    error: {
      kind: "writeFailed",
      path: "/documents/order.dmodel",
      message: "unavailable",
    },
  });
});
