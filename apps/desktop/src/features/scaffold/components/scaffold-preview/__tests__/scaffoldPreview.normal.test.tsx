import { act } from "react";
import { afterEach, expect, test } from "vitest";
import {
  cleanupScaffoldPreviews,
  setupScaffoldPreview,
} from "./scaffoldPreview.test-support";

afterEach(cleanupScaffoldPreviews);

test("生成全文を省略せず読み取り専用で表示する", () => {
  const text = `${"data 注文 = string // TODO 詳細化\n".repeat(300)}// 未変換 <script> & 最終行\n`;
  const host = setupScaffoldPreview(text);
  const textarea = host.querySelector("textarea");
  expect(textarea?.value).toBe(text);
  expect(textarea?.readOnly).toBe(true);
  expect(host.querySelector("script")).toBeNull();
});

test("キャンセルすると確認画面を閉じ、保存先選択に進まない", () => {
  const host = setupScaffoldPreview("data 注文 = string");
  act(() => host.querySelectorAll("button")[0]?.click());
  expect(host.textContent).toBe("キャンバス");
  expect(host.querySelector("textarea")).toBeNull();
});

test("確定すると保存先選択に進む", () => {
  const host = setupScaffoldPreview("data 注文 = string");
  act(() => host.querySelectorAll("button")[1]?.click());
  expect(host.textContent).toBe("保存先選択");
});
