import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import {
  AUTO_SAVE_DEBOUNCE_MS,
  AUTO_SAVE_MAX_INTERVAL_MS,
  type AutoSaveOperations,
} from "./autoSave";
import {
  AutoSaveProvider,
  useAutoSave,
  type AutoSaveContextValue,
} from "./autoSaveContext";

type WriteCall = Readonly<{ path: string; contents: string }>;

type AutoSaveProbe = Readonly<{
  latest: { current: AutoSaveContextValue | undefined };
  rerender: (next: {
    path: string;
    initialContents: string;
  }) => void;
  unmount: () => void;
}>;

/**
 * 呼び出し履歴を記録する自動保存用の外部操作を組み立てる。
 *
 * @param writes ファイル書き込みの呼び出し履歴。
 * @returns テスト用の自動保存操作。
 */
const operationsRecording = (writes: WriteCall[]): AutoSaveOperations => ({
  writeFile: async (path, contents) => {
    writes.push({ path, contents });
    return { type: "ok" };
  },
  now: () => Date.now(),
});

/**
 * Provider 配下の自動保存操作を参照できるテスト用ツリーを描画する。
 *
 * @param operations ファイル書き込みと時刻取得。
 * @returns 最新の Context 値、再描画、unmount。
 */
const renderAutoSave = (operations: AutoSaveOperations): AutoSaveProbe => {
  const latest: { current: AutoSaveContextValue | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    latest.current = useAutoSave();
    return null;
  };

  const renderProvider = (next: {
    path: string;
    initialContents: string;
  }) => {
    act(() => {
      root.render(
        <AutoSaveProvider
          path={next.path}
          initialContents={next.initialContents}
          operations={operations}
        >
          <Probe />
        </AutoSaveProvider>,
      );
    });
  };

  renderProvider({
    path: "/documents/context.dcanvas",
    initialContents: "{}",
  });

  return {
    latest,
    rerender: renderProvider,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
};

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
