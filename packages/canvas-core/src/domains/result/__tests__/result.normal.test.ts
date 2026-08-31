import { expect, test } from "vitest";
import { Result } from "..";

test("成功は保持した値を返す", () => {
  const result = Result.ok(42);

  expect(result).toEqual({ ok: true, value: 42 });
  expect(Result.isOk(result)).toBe(true);
  expect(Result.isErr(result)).toBe(false);
  expect(Result.unwrap(result)).toBe(42);
});

test("失敗は保持したエラーを返す", () => {
  const result = Result.err("失敗");

  expect(result).toEqual({ ok: false, error: "失敗" });
  expect(Result.isErr(result)).toBe(true);
  expect(Result.isOk(result)).toBe(false);
  expect(Result.unwrapErr(result)).toBe("失敗");
});
