import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_MAX_INTERVAL_MS,
  AUTO_SAVE_RETRY_MS,
  type AutoSaveOperations,
} from "../../domains";
import {
  operationsBlockingFirstWrite,
  operationsRecording,
  renderAutoSave,
  type AutoSaveProbe,
  type WriteCall,
} from "./autoSaveContext.test-support";

const probes: AutoSaveProbe[] = [];

afterEach(() => {
  for (const probe of probes.splice(0)) {
    probe.unmount();
  }
  vi.useRealTimers();
});

test("Context に保持した変更は500ms後に自動で書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  });
  expect(writes).toEqual([]);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(probe.latest.current?.autoSave.status).toBe("idle");
});

test("Context に保持した連続変更は最後の変更から500ms後に保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":2}');
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS - 1);
  });
  expect(writes).toEqual([]);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":2}' },
  ]);
});

test("Context に保持した連続変更は最大2秒で最新内容を保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":0}');
  });
  for (const version of Array.from({ length: 19 }, (_, index) => index + 1)) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    act(() => {
      probe.latest.current?.notifyContentsChanged(`{"version":${version}}`);
    });
  }

  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":19}' },
  ]);
});

test("一時停止中の未保存変更は再開後に保持したまま書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
    probe.latest.current?.pause();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS * 2);
  });

  expect(writes).toEqual([]);
  expect(probe.latest.current?.autoSave.status).toBe("pending");

  act(() => {
    probe.latest.current?.resume();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
});

test("トランザクション中は Context のタイマーが満了しても書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.beginTransaction();
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  });

  expect(writes).toEqual([]);
  expect(probe.latest.current?.autoSave.status).toBe("pending");
});

test("flush は Context に保持した未保存変更を即時に書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.beginTransaction();
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await probe.latest.current?.flush();
  });

  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(probe.latest.current?.autoSave.status).toBe("idle");
});

test("保存中の編集は完了後も Context の状態に残る", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  let releaseWrite: ((result: { type: "ok" }) => void) | undefined;
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return new Promise((resolve) => {
        releaseWrite = resolve;
      });
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
  expect(probe.latest.current?.autoSave.status).toBe("saving");

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":2}');
  });
  await act(async () => {
    releaseWrite?.({ type: "ok" });
  });

  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "pending",
    lastSavedContents: '{"version":1}',
    pendingContents: '{"version":2}',
  });
});

test("書き込みが例外でもタイマー起動の自動保存は未処理の rejection にならない", async () => {
  vi.useFakeTimers();
  const rejections: unknown[] = [];
  const onUnhandledRejection = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on("unhandledRejection", onUnhandledRejection);

  const operations: AutoSaveOperations = {
    writeFile: async () => {
      throw new Error("disk full");
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  try {
    act(() => {
      probe.latest.current?.notifyContentsChanged('{"version":1}');
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(rejections).toEqual([]);
  } finally {
    process.off("unhandledRejection", onUnhandledRejection);
  }
});

test("書き込みが例外のとき自動保存状態は failed になる", async () => {
  vi.useFakeTimers();
  const operations: AutoSaveOperations = {
    writeFile: async () => {
      throw new Error("disk full");
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });

  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "failed",
    error: { kind: "writeFailed", message: "disk full" },
  });
});

test("書き込み失敗後は再試行間隔の経過後に Context が再書き込みする", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return {
        type: "err",
        error: { kind: "writeFailed", path, message: "disk full" },
      };
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });
  expect(writes).toHaveLength(1);
  expect(probe.latest.current?.autoSave.status).toBe("failed");

  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_RETRY_MS - 1);
  });
  expect(writes).toHaveLength(1);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);
});

test("保存中のflushは進行中の書き込みの完了後に最新内容を書く", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const pendingWrites: Array<(result: { type: "ok" }) => void> = [];
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return new Promise((resolve) => {
        pendingWrites.push(resolve);
      });
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":2}');
  });
  const flushPromise = probe.latest.current?.flush();
  await act(async () => {
    await Promise.resolve();
  });
  expect(writes).toHaveLength(1);

  await act(async () => {
    pendingWrites[0]?.({ type: "ok" });
    await Promise.resolve();
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
    { path: "/documents/context.dcanvas", contents: '{"version":2}' },
  ]);

  await act(async () => {
    pendingWrites[1]?.({ type: "ok" });
    await flushPromise;
  });
  expect(probe.latest.current?.autoSave.status).toBe("idle");
});

test("明示上書き中に加えた編集は上書き完了後も未保存変更として残す", async () => {
  const writes: WriteCall[] = [];
  const blocking = operationsBlockingFirstWrite(writes);
  const finishOverwrite = blocking.finish;
  const probe = renderAutoSave(blocking.operations);
  probes.push(probe);

  const overwrite = probe.latest.current?.overwrite('{"version":1}');
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":2}');
  });
  await act(async () => {
    finishOverwrite();
    expect(await overwrite).toBe(true);
  });

  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "pending",
    lastSavedContents: '{"version":1}',
    pendingContents: '{"version":2}',
  });
  await act(async () => {
    expect(await probe.latest.current?.flush()).toBe(true);
  });
  expect(writes).toEqual([
    {
      path: "/documents/context.dcanvas",
      contents: '{"version":1}',
    },
    {
      path: "/documents/context.dcanvas",
      contents: '{"version":2}',
    },
  ]);
});

test("文書パスを切り替えると未保存の旧文書は新しいパスへ書き込まない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  probe.rerender({
    path: "/documents/other.dcanvas",
    initialContents: '{"other":true}',
  });

  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_MAX_INTERVAL_MS);
  });
  expect(writes).toEqual([]);
  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "idle",
    path: "/documents/other.dcanvas",
    lastSavedContents: '{"other":true}',
  });
});

test("文書パスを切り替えたあとの変更は新しいパスへ書き込む", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  const probe = renderAutoSave(operationsRecording(writes));
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  probe.rerender({
    path: "/documents/other.dcanvas",
    initialContents: '{"other":true}',
  });
  act(() => {
    probe.latest.current?.notifyContentsChanged('{"other":false}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });
  expect(writes).toEqual([
    { path: "/documents/other.dcanvas", contents: '{"other":false}' },
  ]);
});

test("文書パスを切り替えると進行中の書き込み結果を新しい文書の状態へ反映しない", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  let releaseWrite: ((result: { type: "ok" }) => void) | undefined;
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return new Promise((resolve) => {
        releaseWrite = resolve;
      });
    },
    now: () => Date.now(),
  };
  const probe = renderAutoSave(operations);
  probes.push(probe);

  act(() => {
    probe.latest.current?.notifyContentsChanged('{"version":1}');
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS);
  });
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: '{"version":1}' },
  ]);

  probe.rerender({
    path: "/documents/other.dcanvas",
    initialContents: '{"other":true}',
  });
  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "idle",
    path: "/documents/other.dcanvas",
    lastSavedContents: '{"other":true}',
  });

  await act(async () => {
    releaseWrite?.({ type: "ok" });
  });
  expect(probe.latest.current?.autoSave).toMatchObject({
    status: "idle",
    path: "/documents/other.dcanvas",
    lastSavedContents: '{"other":true}',
  });
});

test("タイマー設定時刻に小数があっても期限後に編集内容を自動保存する", async () => {
  vi.useFakeTimers();
  const writes: WriteCall[] = [];
  let fractionalOffset = 0;
  const probe = renderAutoSave({
    ...operationsRecording(writes),
    now: () => Date.now() + fractionalOffset,
  });
  probes.push(probe);
  act(() => {
    probe.latest.current?.notifyContentsChanged("edited");
    fractionalOffset = 0.25;
  });
  await act(async () => vi.advanceTimersByTimeAsync(AUTO_SAVE_DEBOUNCE_MS));
  expect(writes).toEqual([
    { path: "/documents/context.dcanvas", contents: "edited" },
  ]);
});
