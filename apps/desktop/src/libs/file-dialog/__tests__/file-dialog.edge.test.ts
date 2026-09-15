import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { selectSavePath } from "../index";

afterEach(clearMocks);

test.each([new Error("dialog unavailable"), "dialog unavailable"])("保存先選択の失敗を表示用のメッセージで返す (%s)", async (caught) => {
  mockIPC(() => { throw caught; });
  expect(await selectSavePath("model")).toEqual({ status: "dialogFailed", message: "dialog unavailable" });
});
