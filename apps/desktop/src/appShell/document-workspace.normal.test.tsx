import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import {
  Document,
  Result,
  Serialize,
} from "@domain-modeler/canvas-core";
import type { AutoSaveOperations } from "@/features/auto-save";
import type {
  FileWatchEvent,
  FileWatchOperations,
} from "@/libs/file-watch";
import { DocumentWorkspace } from "./document-workspace";
import {
  autoSaveBlockingFirstWrite,
  fileWatchDeferringFirstRead,
  undoCanvas,
} from "./document-workspace.test-support";
import { TabsState } from "./tabs";

type RenderedWorkspace = Readonly<{
  host: HTMLDivElement;
  rerender: (tabsState: TabsState) => void;
  unmount: () => void;
}>;

const rendered: RenderedWorkspace[] = [];

afterEach(() => {
  vi.useRealTimers();
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

/**
 * DocumentWorkspace を描画してホスト要素を返す。
 *
 * @param tabsState 表示するタブ状態。
 * @returns 描画先と再描画。
 */
const renderWorkspace = (
  tabsState: TabsState,
  autoSaveOperations?: AutoSaveOperations,
  fileWatchOperations?: FileWatchOperations,
  dispatchExternalFileAction?: React.ComponentProps<
    typeof DocumentWorkspace
  >["dispatchExternalFileAction"],
  registerSaveSession?: React.ComponentProps<
    typeof DocumentWorkspace
  >["registerSaveSession"],
): Pick<RenderedWorkspace, "host" | "rerender"> => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const rerender = (next: TabsState): void => {
    act(() => {
      root.render(
        <DocumentWorkspace
          tabsState={next}
          autoSaveOperations={autoSaveOperations}
          fileWatchOperations={fileWatchOperations}
          dispatchExternalFileAction={dispatchExternalFileAction}
          registerSaveSession={registerSaveSession}
        />,
      );
    });
  };

  rerender(tabsState);

  rendered.push({
    host,
    rerender,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  });
  return { host, rerender };
};

/**
 * 指定した aria-label のボタンを返す。
 *
 * @param host 描画先。
 * @param name ボタンの名前。
 * @returns 該当するボタン。無ければ空のボタン。
 */
const buttonNamed = (host: HTMLDivElement, name: string): HTMLButtonElement => {
  const found = Array.from(host.querySelectorAll("section:not([hidden]) button")).find(
    (element) =>
      element.getAttribute("aria-label") === name || element.textContent === name,
  );
  return found instanceof HTMLButtonElement
    ? found
    : document.createElement("button");
};

test("キャンバス文書が前面のとき8種の付箋ボタンとズーム表示がある", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(tabsState);
  const captions = [
    "Domain Event",
    "Command",
    "Actor",
    "Aggregate",
    "Policy",
    "Read Model",
    "External System",
    "Hotspot",
  ];

  expect(
    captions.map((caption) =>
      Array.from(host.querySelectorAll("section:not([hidden]) button")).some(
        (button) => button.getAttribute("aria-label") === caption,
      )
        ? caption
        : "",
    ),
  ).toEqual(captions);
  expect(host.querySelector('[aria-label="ズーム 100%"]')?.textContent).toBe(
    "100%",
  );
  expect(host.querySelector('[role="status"]')?.textContent).toBe("保存済み");
});

test("モデル文書が前面のときはキャンバスツールバーを出さない", () => {
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(tabsState);

  expect(host.querySelector('[aria-label="キャンバスツール"]')).toBeNull();
  expect(host.querySelector('[aria-label="ドメインモデルのテキスト"]')).toBeInstanceOf(HTMLTextAreaElement);
});

test("モデル文書の自動保存に失敗すると理由を画面へ表示する", async () => {
  vi.useFakeTimers();
  const operations: AutoSaveOperations = {
    writeFile: async (path) => ({
      type: "err",
      error: { kind: "writeFailed", path, message: "permission denied" },
    }),
    now: Date.now,
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(tabsState, operations);
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data Order = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });

  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "permission denied",
  );
});

test("作成したモデル文書の外部変更をエディタへ取り込む", async () => {
  let notify: (event: FileWatchEvent) => void = () => {};
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({ type: "ok", value: "data Order = string" }),
  };
  const actions: string[] = [];
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    undefined,
    watchOperations,
    (action) => actions.push(action.type),
  );
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
  });

  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    "data Order = string",
  );
  expect(actions).toContain("clearFileMissing");
});

test("外部変更の再読込に成功すると以前の監視エラーを消す", async () => {
  let notify: (event: FileWatchEvent) => void = () => {};
  let readCount = 0;
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => {
      readCount += 1;
      return readCount === 1
        ? {
            type: "err",
            error: {
              kind: "readFailed",
              path: "/documents/order.dmodel",
              message: "permission denied",
            },
          }
        : { type: "ok", value: "" };
    },
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    undefined,
    watchOperations,
    () => {},
  );

  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "permission denied",
  );

  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  await vi.waitFor(() => {
    expect(host.querySelector('[role="alert"]')).toBeNull();
  });
});

test("未保存のモデル編集と外部変更が競合したら自動保存を止めて選択を待つ", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({ type: "ok", value: "external" }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    "local draft",
  );
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "競合",
  );

  const useExternal = Array.from(host.querySelectorAll("button")).find(
    (button) => button.textContent === "外部変更を読み込む",
  );
  act(() => useExternal?.click());
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    "external",
  );
});

test("外部変更の読込中は保留中のモデル編集を上書き保存しない", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  let finishRead: (contents: string) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () =>
      await new Promise((resolve) => {
        finishRead = (contents) => resolve({ type: "ok", value: contents });
      }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);

  await act(async () => {
    finishRead("external");
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(writes).toEqual([]);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "競合",
  );
});

test("外部変更の読込中に始めたキャンバス下書きを競合判定へ含める", async () => {
  const externalContents = Serialize.stringify(Document.empty("external"));
  const watch = fileWatchDeferringFirstRead(externalContents);
  const watchOperations = watch.operations;
  let flush: () => Promise<boolean> = async () => false;
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async () => ({ type: "ok" }),
    now: Date.now,
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
    (_path, nextFlush) => {
      flush = nextFlush;
      return () => {};
    },
  );
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }),
    );
  });
  act(() => {
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  await act(async () => {
    expect(await flush()).toBe(true);
  });

  await act(async () => {
    watch.notify({ type: "changed", path: "/documents/order.dcanvas" });
    await Promise.resolve();
  });
  await vi.waitFor(() => {
    expect(watch.isFirstReadPending()).toBe(true);
  });
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "draft after read started");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await act(async () => {
    watch.finishFirstRead(externalContents);
    await Promise.resolve();
    await Promise.resolve();
  });
  await vi.waitFor(() => {
    expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
      "draft after read started",
    );
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "競合",
    );
  });
});

test("未保存編集のあるファイルが外部削除されたら保存を止めて削除を維持できる", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const actions: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "err",
      error: { kind: "notFound", path: "/documents/order.dmodel" },
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    (action) => actions.push(action.type),
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "deleted", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(actions).toContain("markFileMissing");
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "削除され",
  );

  act(() => buttonNamed(host, "削除を維持").click());
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe("");
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });
  expect(writes).toEqual([]);
});

test("外部削除と競合した未保存編集を選ぶとファイルを再作成する", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "err",
      error: { kind: "notFound", path: "/documents/order.dmodel" },
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "deleted", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });

  act(() => buttonNamed(host, "編集内容で再作成").click());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });

  expect(writes).toEqual(["local draft"]);
});

test("外部削除後の状態を確認できない間は保存を止め明示的な上書きを待つ", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "err",
      error: { kind: "invalidUtf8", path: "/documents/order.dmodel" },
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "deleted", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(host.textContent).toContain("自動保存を停止");

  act(() => buttonNamed(host, "編集内容で上書き").click());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(writes).toEqual(["local draft"]);
});

test("未編集時の外部変更を読めなくても明示的な解決まで以後の保存を止める", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "err",
      error: { kind: "invalidUtf8", path: "/documents/order.dmodel" },
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );

  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
    await Promise.resolve();
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "edit after unreadable change");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(host.textContent).toContain("自動保存を停止");

  act(() => buttonNamed(host, "編集内容で上書き").click());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(writes).toEqual(["edit after unreadable change"]);
});

test("監視バックエンドの実行時失敗を表示して自動保存を停止する", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({ type: "ok", value: "" }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );

  await act(async () => {
    notify({
      type: "watchFailed",
      path: "/documents/order.dmodel",
      message: "watch backend overflow",
    });
    await Promise.resolve();
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "edit after watcher failure");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(host.textContent).toContain("watch backend overflow");
  expect(host.textContent).toContain("自動保存を停止");
});

test("ファイル監視を開始できない場合も自動保存を停止する", async () => {
  vi.useFakeTimers();
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async () => ({
      type: "err",
      error: {
        kind: "watchFailed",
        path: "/documents/order.dmodel",
        message: "watch setup denied",
      },
    }),
    readFile: async () => ({ type: "ok", value: "" }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );

  await act(async () => {
    await Promise.resolve();
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "edit without watcher");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });

  expect(writes).toEqual([]);
  expect(host.textContent).toContain("watch setup denied");
  expect(host.textContent).toContain("自動保存を停止");
});

test("保存中に外部変更を検出したら保存完了後にファイルを再評価する", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  let finishWrite: () => void = () => {};
  let diskContents = "external";
  let readCount = 0;
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) =>
      await new Promise((resolve) => {
        finishWrite = () => {
          diskContents = contents;
          resolve({ type: "ok" });
        };
      }),
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => {
      readCount += 1;
      return { type: "ok", value: diskContents };
    },
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
  });

  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(readCount).toBe(0);

  await act(async () => {
    finishWrite();
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(readCount).toBe(1);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    "local draft",
  );
});

test("連続した外部変更は読み込みと適用を文書ごとに直列化する", async () => {
  let notify: (event: FileWatchEvent) => void = () => {};
  const reads: Array<(contents: string) => void> = [];
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () =>
      await new Promise((resolve) => {
        reads.push((contents) => resolve({ type: "ok", value: contents }));
      }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const { host } = renderWorkspace(
    tabsState,
    undefined,
    watchOperations,
    () => {},
  );
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dmodel" });
    notify({ type: "changed", path: "/documents/order.dmodel" });
    await Promise.resolve();
  });
  expect(reads).toHaveLength(1);

  await act(async () => {
    reads[0]?.("older");
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(reads).toHaveLength(2);
  await act(async () => {
    reads[1]?.("newer");
    await Promise.resolve();
    await Promise.resolve();
  });

  await vi.waitFor(() => {
    expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
      "newer",
    );
  });
});

test("連続した外部キャンバス変更をundoすると直前の外部状態へ戻る", async () => {
  let notify: (event: FileWatchEvent) => void = () => {};
  const older = Result.unwrap(
    Document.addSticky(
      Document.empty(),
      "actor",
      "older",
      { x: 40, y: 40 },
      { width: 120, height: 80 },
    ),
  );
  const newer = Result.unwrap(
    Document.addSticky(
      older,
      "command",
      "newer",
      { x: 240, y: 40 },
      { width: 140, height: 90 },
    ),
  );
  let readCount = 0;
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "ok",
      value: Serialize.stringify(readCount++ === 0 ? older : newer),
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    undefined,
    watchOperations,
    () => {},
  );
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dcanvas" });
    notify({ type: "changed", path: "/documents/order.dcanvas" });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });

  await vi.waitFor(() => {
    expect(host.querySelectorAll("article")).toHaveLength(2);
  });
  undoCanvas(host);
  expect(host.querySelectorAll("article")).toHaveLength(1);
  expect(host.textContent).toContain("older");
  expect(host.textContent).not.toContain("newer");
});

test("キャンバスの編集中下書きと外部変更が競合したら下書きを保持する", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async () => ({ type: "ok" }),
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "ok",
      value: Serialize.stringify(Document.empty()),
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }),
    );
  });
  act(() => {
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "local canvas draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dcanvas" });
    await Promise.resolve();
    await Promise.resolve();
  });

  await vi.waitFor(() => {
    expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
      "local canvas draft",
    );
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "競合",
    );
  });
});

test("キャンバス下書きの競合上書きに失敗しても再試行できる", async () => {
  vi.useFakeTimers();
  let notify: (event: FileWatchEvent) => void = () => {};
  const writes: string[] = [];
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push(contents);
      return writes.length === 2
        ? {
            type: "err",
            error: { kind: "writeFailed", path, message: "disk full" },
          }
        : { type: "ok" };
    },
    now: Date.now,
  };
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "ok",
      value: Serialize.stringify(Document.empty()),
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    watchOperations,
    () => {},
  );
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }),
    );
  });
  act(() => {
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "retry this draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dcanvas" });
    await Promise.resolve();
    await Promise.resolve();
  });
  await vi.waitFor(() => {
    expect(host.textContent).toContain("競合");
  });

  await act(async () => {
    buttonNamed(host, "編集中の内容を保存").click();
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(host.textContent).toContain("上書きできませんでした");
  expect(host.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe(
    "retry this draft",
  );

  await act(async () => {
    buttonNamed(host, "編集中の内容を保存").click();
    await Promise.resolve();
    await Promise.resolve();
  });
  expect(writes).toHaveLength(3);
  expect(writes[2]).toContain("retry this draft");
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("終了flushはキャンバスの編集中下書きを確定して保存する", async () => {
  vi.useFakeTimers();
  const writes: string[] = [];
  let flush: () => Promise<boolean> = async () => false;
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    undefined,
    undefined,
    (_path, nextFlush) => {
      flush = nextFlush;
      return () => {};
    },
  );
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }),
    );
  });
  act(() => {
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "saved on close");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await act(async () => {
    expect(await flush()).toBe(true);
  });

  expect(writes[writes.length - 1]).toContain("saved on close");
});

test("終了flushの書込中に始まったキャンバス下書きも再flushする", async () => {
  const writes: string[] = [];
  const blocking = autoSaveBlockingFirstWrite(writes);
  const autoSaveOperations = blocking.operations;
  const finishFirstWrite = blocking.finishFirstWrite;
  let flush: () => Promise<boolean> = async () => false;
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    autoSaveOperations,
    undefined,
    undefined,
    (_path, nextFlush) => {
      flush = nextFlush;
      return () => {};
    },
  );
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }),
    );
  });
  act(() => {
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });

  let closing: Promise<boolean> = Promise.resolve(false);
  await act(async () => {
    closing = flush();
    await Promise.resolve();
  });
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "draft typed while closing");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await act(async () => {
    finishFirstWrite();
    expect(await closing).toBe(true);
  });

  expect(writes).toHaveLength(2);
  expect(writes[1]).toContain("draft typed while closing");
});

test("外部キャンバス変更を取り込んだ後もundoで変更前へ戻せる", async () => {
  let notify: (event: FileWatchEvent) => void = () => {};
  const externalDocument = Result.unwrap(
    Document.addSticky(
      Document.empty(),
      "command",
      "external",
      { x: 80, y: 90 },
      { width: 140, height: 100 },
    ),
  );
  const watchOperations: FileWatchOperations = {
    watch: async (_path, onEvent) => {
      notify = onEvent;
      return { type: "ok", stop: async () => {} };
    },
    readFile: async () => ({
      type: "ok",
      value: Serialize.stringify(externalDocument),
    }),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(
    tabsState,
    undefined,
    watchOperations,
    () => {},
  );
  await act(async () => {
    notify({ type: "changed", path: "/documents/order.dcanvas" });
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(host.querySelectorAll("article")).toHaveLength(1);
  undoCanvas(host);
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("モデルを変更直後に背景化しても自動保存を継続する", async () => {
  vi.useFakeTimers();
  const writes: Array<{ path: string; contents: string }> = [];
  const operations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      writes.push({ path, contents });
      return { type: "ok" };
    },
    now: Date.now,
  };
  const model = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dmodel",
    documentType: "model",
  });
  const canvas = TabsState.reducer(model, {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const { host, rerender } = renderWorkspace(model, operations);
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data Order = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  rerender(canvas);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });

  expect(writes).toEqual([
    { path: "/documents/order.dmodel", contents: "data Order = string" },
  ]);
});

test("背景のキャンバスは前面タブのSpaceパンを妨げず、切り替え後もビューポートを保持する", async () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab", path: "/first.dcanvas", documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab", path: "/second.dcanvas", documentType: "canvas",
  });
  const firstActive = TabsState.reducer(second, { type: "activateTab", path: "/first.dcanvas" });
  const { host, rerender } = renderWorkspace(first);
  await act(async () => rerender(second));
  const surface = host.querySelector<HTMLElement>("section:not([hidden]) .canvas-surface");
  expect(surface).not.toBeNull();
  await act(async () => {
    surface?.focus();
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true, cancelable: true, key: " ", code: "Space",
    }));
    // 非背景の子要素上から開始するため、Spaceが届かない場合はパンしない。
    const child = document.createElement("span");
    surface?.append(child);
    child.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, button: 0, pointerId: 20, clientX: 100, clientY: 80,
    }));
  });
  expect(surface?.getAttribute("data-panning")).toBe("true");
  await act(async () => {
    surface?.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, button: 0, pointerId: 20, clientX: 132, clientY: 104,
    }));
  });
  expect(host.querySelector<HTMLElement>("section:not([hidden]) .canvas-world")?.style.transform).toBe("translate(32px, 24px) scale(1)");
  // キー・ポインターを押したまま切り替え、非表示中のkeyupも取りこぼさない。
  await act(async () => rerender(firstActive));
  await act(async () => window.dispatchEvent(new KeyboardEvent("keyup", { key: " ", code: "Space" })));
  await act(async () => rerender(second));
  expect(surface?.getAttribute("data-panning")).toBe("false");
  expect(host.querySelector<HTMLElement>("section:not([hidden]) .canvas-world")?.style.transform).toBe("translate(32px, 24px) scale(1)");
});

test("ドラッグ中に背景へ移した付箋は開始位置へ戻り復帰後に再操作できる", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/first.dcanvas",
    documentType: "canvas",
  });
  const second = TabsState.reducer(first, {
    type: "openTab",
    path: "/second.dcanvas",
    documentType: "canvas",
  });
  const firstActive = TabsState.reducer(second, {
    type: "activateTab",
    path: "/first.dcanvas",
  });
  const { host, rerender } = renderWorkspace(first);
  const surface = host.querySelector<HTMLElement>(".canvas-surface");
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    surface?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  const article = host.querySelector<HTMLElement>("article");
  const originalLeft = article?.style.left;
  const originalTop = article?.style.top;

  act(() => {
    article?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 1,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    article?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        clientX: 130,
        clientY: 130,
      }),
    );
  });
  expect(article?.style.left).not.toBe(originalLeft);

  rerender(second);
  rerender(firstActive);
  const restored = host.querySelector<HTMLElement>(
    "section:not([hidden]) article",
  );
  expect(restored?.style.left).toBe(originalLeft);
  expect(restored?.style.top).toBe(originalTop);

  act(() => {
    restored?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 2,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    restored?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 2,
        isPrimary: true,
        clientX: 120,
        clientY: 120,
      }),
    );
    restored?.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 2,
        isPrimary: true,
        clientX: 120,
        clientY: 120,
      }),
    );
  });

  expect(restored?.style.left).toBe(
    `${Number.parseFloat(originalLeft ?? "0") + 20}px`,
  );
  expect(restored?.style.top).toBe(
    `${Number.parseFloat(originalTop ?? "0") + 20}px`,
  );
});

test("ドラッグ中の一時位置は自動保存せず確定後の位置だけを保存する", async () => {
  vi.useFakeTimers();
  const writes: string[] = [];
  const operations: AutoSaveOperations = {
    writeFile: async (_path, contents) => {
      writes.push(contents);
      return { type: "ok" };
    },
    now: Date.now,
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/board.dcanvas",
    documentType: "canvas",
  });
  const { host } = renderWorkspace(tabsState, operations);
  act(() => buttonNamed(host, "Domain Event").click());
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    host.querySelector<HTMLTextAreaElement>("textarea")?.blur();
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  writes.splice(0);
  const article = host.querySelector<HTMLElement>("article");
  act(() => {
    article?.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 9,
        isPrimary: true,
        clientX: 100,
        clientY: 100,
      }),
    );
    article?.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 9,
        isPrimary: true,
        clientX: 160,
        clientY: 150,
      }),
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });
  expect(writes).toEqual([]);

  act(() => {
    article?.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        pointerId: 9,
        isPrimary: true,
        clientX: 160,
        clientY: 150,
      }),
    );
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(500);
  });
  expect(writes).toHaveLength(1);
});

test("キャンバス文書を切り替えると種別の選択は文書ごとに初期状態に戻る", () => {
  const first = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path: "/documents/order.dcanvas",
    documentType: "canvas",
  });
  const bothOpen = TabsState.reducer(first, {
    type: "openTab",
    path: "/documents/stock.dcanvas",
    documentType: "canvas",
  });
  const orderActive = TabsState.reducer(bothOpen, {
    type: "activateTab",
    path: "/documents/order.dcanvas",
  });
  const { host, rerender } = renderWorkspace(orderActive);

  act(() => {
    buttonNamed(host, "Command").click();
  });
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe("true");

  rerender(bothOpen);

  expect(buttonNamed(host, "選択").getAttribute("aria-pressed")).toBe(
    "true",
  );
  expect(buttonNamed(host, "Command").getAttribute("aria-pressed")).toBe(
    "false",
  );
});
