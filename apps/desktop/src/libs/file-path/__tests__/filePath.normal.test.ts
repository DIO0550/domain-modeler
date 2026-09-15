import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { sameFilePath } from "..";

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
