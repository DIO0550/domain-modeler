import { expect, test } from "vitest";
import { writeFileAsResult } from "../index";

test("書き込みが成功すると ok を返す", async () => {
  const result = await writeFileAsResult(
    async () => ({ type: "ok" }),
    { path: "/documents/context.dcanvas", contents: "{}" },
  );

  expect(result).toEqual({ type: "ok" });
});

test("書き込みが失敗結果を返すとそのまま伝える", async () => {
  const error = {
    kind: "writeFailed",
    path: "/documents/context.dcanvas",
    message: "permission denied",
  } as const;

  const result = await writeFileAsResult(
    async () => ({ type: "err", error }),
    { path: "/documents/context.dcanvas", contents: "{}" },
  );

  expect(result).toEqual({ type: "err", error });
});
