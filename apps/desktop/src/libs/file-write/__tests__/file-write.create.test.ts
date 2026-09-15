import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { afterEach, expect, test } from "vitest";
import { createDmodelFile } from "../index";

afterEach(clearMocks);

test("新規モデルの保存先と全文を新規作成専用IPCへ渡す", async () => {
  const target = { path: "/generated.dmodel", contents: "// 注文\n" };
  mockIPC((command, payload) => {
    expect(command).toBe("create_dmodel_file");
    expect(payload).toEqual(target);
    return { type: "ok" };
  });
  expect(await createDmodelFile(target)).toEqual({ type: "ok" });
});

test("新規作成の拒否理由をそのまま返す", async () => {
  const error = {
    kind: "writeFailed",
    path: "/existing.dmodel",
    message: "already exists",
  } as const;
  mockIPC(() => ({ type: "err", error }));
  expect(await createDmodelFile({ path: error.path, contents: "model" })).toEqual({ type: "err", error });
});

test.each([new Error("connection failed"), "connection failed"])(
  "新規作成IPCの例外をパス付きの失敗結果にする (%s)",
  async (caught) => {
    mockIPC(() => { throw caught; });
    expect(await createDmodelFile({ path: "/generated.dmodel", contents: "model" })).toEqual({
      type: "err",
      error: { kind: "writeFailed", path: "/generated.dmodel", message: "connection failed" },
    });
  },
);
