import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { Document, Serialize } from "@domain-modeler/canvas-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import App from "../../App";

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  clearMocks();
  vi.useRealTimers();
});

/** 実際のAppを描画する。外部I/Oだけを各テストで差し替える。 */
const renderApp = () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<App />));
  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
};

/** メニューまたはタブのボタンを表示名で押す。 */
const clickNamed = async (host: HTMLElement, name: string) => {
  const button = Array.from(host.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === name,
  );
  expect(button).toBeDefined();
  await act(async () => button?.click());
};

const newDocument = async (host: HTMLElement, kind: "model" | "canvas") => {
  await clickNamed(host, "ファイル");
  await clickNamed(
    host,
    kind === "model" ? "新規ドメインモデル" : "新規キャンバス",
  );
};
const editModel = async (host: HTMLElement, text: string) => {
  const input = host.querySelector("textarea");
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, text);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const saveShortcut = async () => {
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }),
    ),
  );
};

test.each([
  "canvas",
  "model",
] as const)("%s の新規作成はダイアログも書き込みも行わず編集画面を開く", async (kind) => {
  const commands: string[] = [];
  mockIPC((command) => {
    commands.push(command);
    return null;
  });
  const host = renderApp();
  await newDocument(host, kind);
  expect(host.querySelector('[role="tab"]')?.textContent).toContain("未保存");
  expect(
    host.querySelector(kind === "model" ? "textarea" : ".canvas-surface"),
  ).not.toBeNull();
  expect(commands).toEqual([]);
});

test.each([
  "canvas",
  "model",
] as const)("%s を初回保存すると内容とタブ名を保存先へ引き継ぐ", async (kind) => {
  const path = `/new.d${kind}`;
  const files = new Map<string, string>();
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      return path;
    }
    expect(command).toBe("create_file");
    const file = payload as { path: string; contents: string };
    files.set(file.path, file.contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, kind);
  if (kind === "model") {
    await editModel(host, "data Order = string");
  }
  await saveShortcut();
  expect(host.querySelector('[role="tab"]')?.textContent).toContain(
    `new.d${kind}`,
  );
  expect(files.get(path)).toBe(
    kind === "model"
      ? "data Order = string"
      : Serialize.stringify(Document.empty()),
  );
  if (kind === "model") {
    expect(host.querySelector("textarea")?.value).toBe("data Order = string");
  }
});

test("保存取消後もモデルの編集を保持し、保存前の自動保存は書き込まない", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const commands: string[] = [];
  mockIPC((command) => {
    commands.push(command);
    return null;
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data Order = string");
  await saveShortcut();
  await act(async () => vi.advanceTimersByTimeAsync(3000));
  expect(host.querySelector("textarea")?.value).toBe("data Order = string");
  expect(host.querySelector('[role="tab"]')?.textContent).toContain("未保存");
  expect(commands).toEqual(["save_file_dialog"]);
});

test.each([
  "dialog",
  "write",
])("%s の失敗後も編集を保持して保存を再試行できる", async (failure) => {
  let shouldFail = true;
  mockIPC((command) => {
    if (command === "save_file_dialog") {
      if (failure === "dialog" && shouldFail) {
        throw new Error("dialog unavailable");
      }
      return "/retry.dmodel";
    }
    expect(command).toBe("create_file");
    if (shouldFail) {
      throw new Error("permission denied");
    }
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data Order = string");
  await saveShortcut();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    failure === "dialog" ? "dialog unavailable" : "permission denied",
  );
  expect(host.querySelector("textarea")?.value).toBe("data Order = string");
  shouldFail = false;
  await saveShortcut();
  expect(host.querySelector('[role="tab"]')?.textContent).toContain(
    "retry.dmodel",
  );
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("保存先の既存ファイルと競合しても下書きを保持する", async () => {
  mockIPC((command) =>
    command === "save_file_dialog"
      ? "/existing.dmodel"
      : {
          type: "err",
          error: {
            kind: "writeFailed",
            path: "/existing.dmodel",
            message: "already exists",
          },
        },
  );
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data Order = string");
  await saveShortcut();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "already exists",
  );
  expect(host.querySelector("textarea")?.value).toBe("data Order = string");
});

test("初回保存の書き込み中に再編集しても最新内容を同じファイルに保存する", async () => {
  let finish: (result: { type: "ok" }) => void = () => {};
  const files = new Map<string, string>();
  let dialogs = 0;
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      dialogs += 1;
      return "/draft.dmodel";
    }
    const file = payload as { path: string; contents: string };
    if (command === "create_file") {
      return new Promise<{ type: "ok" }>((resolve) => {
        finish = (result) => {
          files.set(file.path, file.contents);
          resolve(result);
        };
      });
    }
    expect(command).toBe("write_file");
    files.set(file.path, file.contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data Before = string");
  await saveShortcut();
  await saveShortcut();
  await editModel(host, "data After = int");
  await act(async () => finish({ type: "ok" }));
  await saveShortcut();
  expect(files.get("/draft.dmodel")).toBe("data After = int");
  expect(host.querySelector("textarea")?.value).toBe("data After = int");
  expect(dialogs).toBe(1);
});

test.each([
  "キャンセル",
  "保存せずに閉じる",
  "保存して閉じる",
])("未保存タブを閉じるとき %s を選べる", async (choice) => {
  const files = new Map<string, string>();
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      return "/draft.dmodel";
    }
    const file = payload as { path: string; contents: string };
    files.set(file.path, file.contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, "model");
  await editModel(host, "data Order = string");
  await clickNamed(host, "ファイル");
  await clickNamed(host, "タブを閉じる");
  expect(host.querySelector("dialog")).not.toBeNull();
  await clickNamed(host, choice);
  expect(host.querySelector('[role="tab"]') !== null).toBe(
    choice === "キャンセル",
  );
  expect(files.has("/draft.dmodel")).toBe(choice === "保存して閉じる");
});

test.each([
  "model",
  "canvas",
] as const)("%s の終了時に初回保存を取り消してもタブを閉じない", async (kind) => {
  mockIPC(() => null);
  const host = renderApp();
  await newDocument(host, kind);
  await clickNamed(host, "ファイル");
  await clickNamed(host, "タブを閉じる");
  await clickNamed(host, "保存して閉じる");
  expect(host.querySelector('[role="tab"]')?.textContent).toContain("未保存");
  expect(host.querySelector("dialog")).toBeNull();
});

test.each([
  "model",
  "canvas",
] as const)("%s の初回保存先が別のタブのパスと一致したら既存文書を保護する", async (kind) => {
  let selections = 0;
  const created: string[] = [];
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      selections += 1;
      return selections === 1 ? `/Draft.d${kind}` : `/draft.d${kind}`;
    }
    if (command === "same_file_path") {
      return true;
    }
    expect(command).toBe("create_file");
    created.push((payload as { path: string }).path);
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, kind);
  await saveShortcut();
  await newDocument(host, kind);
  await saveShortcut();
  expect(created).toEqual([`/Draft.d${kind}`]);
  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(2);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    "開いている文書と同じパス",
  );
});

test("初回保存後のモデル編集は選択済みのパスに自動保存する", async () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  const files = new Map<string, string>();
  let selections = 0;
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      selections += 1;
      return "/draft.dmodel";
    }
    const file = payload as { path: string; contents: string };
    files.set(file.path, file.contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await newDocument(host, "model");
  await saveShortcut();
  await editModel(host, "data After = string");
  await act(async () => vi.advanceTimersByTimeAsync(1000));
  expect(files.get("/draft.dmodel")).toBe("data After = string");
  expect(selections).toBe(1);
});

test("モデルの構造化プレビューは編集と文書切り替え後も入力内容に追従する", async () => {
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      const kind = (payload as { kind: string }).kind;
      return kind === "model" ? "/draft.dmodel" : "/board.dcanvas";
    }
    expect(command).toBe("create_file");
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  await saveShortcut();
  const input = host.querySelector("textarea");
  expect(input).toBeInstanceOf(HTMLTextAreaElement);
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data 注文 = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(
    host.querySelector(
      '[aria-label="構造化プレビュー"] [data-decl-name="注文"]',
    )?.textContent,
  ).toContain("string");
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data 数量 = int constrained 1..100");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(host.querySelector('[data-decl-name="注文"]')).toBeNull();
  expect(host.querySelector('[data-decl-name="数量"]')?.textContent).toContain(
    "1..100",
  );
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  await saveShortcut();
  const modelTab = Array.from(
    host.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ).find((tab) => tab.textContent?.includes("draft.dmodel"));
  expect(modelTab).toBeDefined();
  await act(async () => modelTab?.click());
  expect(
    host.querySelector<HTMLTextAreaElement>("section:not([hidden]) textarea")
      ?.value,
  ).toBe("data 数量 = int constrained 1..100");
  expect(host.querySelector('[data-decl-name="数量"]')?.textContent).toContain(
    "VALUE",
  );
});

test("モデルの未保存入力を書き終えるまでタブを閉じない", async () => {
  let finishWrite: (result: { type: "ok" }) => void = () => {};
  const writes: Array<{ path: string; contents: string }> = [];
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      return "/draft.dmodel";
    }
    if (command === "create_file") {
      return { type: "ok" };
    }
    expect(command).toBe("write_file");
    writes.push(payload as { path: string; contents: string });
    return new Promise<{ type: "ok" }>((resolve) => {
      finishWrite = resolve;
    });
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  await saveShortcut();
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data Order = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await clickNamed(host, "ファイル");
  await clickNamed(host, "タブを閉じる");
  await act(async () => Promise.resolve());

  expect(writes).toEqual([
    { path: "/draft.dmodel", contents: "data Order = string" },
  ]);
  expect(host.querySelector('[role="tab"]')).not.toBeNull();

  await act(async () => {
    finishWrite({ type: "ok" });
  });
  expect(host.querySelector('[role="tab"]')).toBeNull();
});

test("モデルの未保存入力を書き込めなければタブを閉じない", async () => {
  mockIPC((command) => {
    if (command === "save_file_dialog") {
      return "/draft.dmodel";
    }
    if (command === "create_file") {
      return { type: "ok" };
    }
    expect(command).toBe("write_file");
    return {
      type: "err",
      error: {
        kind: "writeFailed",
        path: "/draft.dmodel",
        message: "permission denied",
      },
    };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  await saveShortcut();
  const input = host.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, "data Order = string");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await clickNamed(host, "ファイル");
  await clickNamed(host, "タブを閉じる");
  await act(async () => Promise.resolve());

  expect(host.querySelector('[role="tab"]')).not.toBeNull();
  expect(host.querySelector("textarea")?.value).toBe("data Order = string");
});

test("キャンバスの編集内容を保存してからタブを閉じる", async () => {
  const writes: Array<{ path: string; contents: string }> = [];
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      return "/board.dcanvas";
    }
    if (command === "create_file") {
      return { type: "ok" };
    }
    expect(command).toBe("write_file");
    writes.push(payload as { path: string; contents: string });
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  await saveShortcut();
  await clickNamed(host, "Domain Event");
  act(() => {
    host.querySelector(".canvas-surface")?.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
      }),
    );
  });

  await clickNamed(host, "ファイル");
  await clickNamed(host, "タブを閉じる");
  await act(async () => Promise.resolve());

  expect(writes).toHaveLength(1);
  const saved = Serialize.parse(writes[0]?.contents ?? "");
  expect(saved.ok).toBe(true);
  if (saved.ok) {
    expect(saved.value.stickies).toHaveLength(1);
  }
  expect(host.querySelector('[role="tab"]')).toBeNull();
});
