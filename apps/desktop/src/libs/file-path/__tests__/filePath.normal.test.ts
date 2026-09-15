import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { displayFilePath, sameFilePath } from "..";

afterEach(() => {
  clearMocks();
});

test("ファイルシステムが同一と判定したパスは一致する", async () => {
  mockIPC((command, payload) => {
    expect(command).toBe("same_file_path");
    expect(payload).toEqual({ left: "/docs/Draft.dmodel", right: "/docs/draft.dmodel" });
    return true;
  });

  await expect(
    sameFilePath("/docs/Draft.dmodel", "/docs/draft.dmodel"),
  ).resolves.toBe(true);
});

test("IPCを利用できなくても同一文字列のパスは一致する", async () => {
  mockIPC(() => {
    throw new Error("IPC unavailable");
  });

  await expect(sameFilePath("/docs/draft.dmodel", "/docs/draft.dmodel"))
    .resolves.toBe(true);
});

test("非UTF-8パスの可逆IPC表現は表示部分だけを返す", () => {
  expect(displayFilePath("\0domain-modeler-path-v1:unix:ff|/tmp/�/draft.dmodel"))
    .toBe("/tmp/�/draft.dmodel");
});

test("通常のパスは表示時も変更しない", () => {
  expect(displayFilePath("/tmp/注文.dmodel")).toBe("/tmp/注文.dmodel");
});
