import { expect, test } from "vitest";
import { Result } from "..";

test("ok は成功値を保持する", () => {
  expect(Result.ok(42)).toEqual({ ok: true, value: 42 });
  expect(Result.isOk(Result.ok(42))).toBe(true);
  expect(Result.isErr(Result.ok(42))).toBe(false);
});

test("err は失敗値を保持する", () => {
  expect(Result.err("失敗")).toEqual({ ok: false, error: "失敗" });
  expect(Result.isErr(Result.err("失敗"))).toBe(true);
  expect(Result.isOk(Result.err("失敗"))).toBe(false);
});
