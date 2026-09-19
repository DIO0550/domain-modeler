import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { Document, Serialize } from "@domain-modeler/canvas-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import App from "../../App";

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  clearMocks();
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

test.each(["model", "canvas"])("開いている %s のパスを別の大文字小文字で再選択しても編集状態を保持し再作成しない", async (kind) => {
  const path = kind === "model" ? "/Draft.dmodel" : "/Draft.dcanvas";
  const selectedPath = path.toLowerCase();
  const label = kind === "model" ? "新規ドメインモデル" : "新規キャンバス";
  const files = new Map<string, string>();
  let selectionCount = 0;
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      selectionCount += 1;
      return selectionCount === 1 ? path : selectedPath;
    }
    if (command === "same_file_path") {
      const { left, right } = payload as { left: string; right: string };
      return left.toLowerCase() === right.toLowerCase();
    }
    expect(command).toBe("create_file");
    const { contents } = payload as { contents: string };
    files.set(path, contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, label);
  const textarea = host.querySelector("textarea");
  if (textarea === null) { await clickNamed(host, "Domain Event"); }
  await act(async () => {
    if (textarea !== null) {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(textarea, "// draft");
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    host.querySelector(".canvas-world")?.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 60 }));
  });
  // 外部削除後も、開いている編集セッションへの新規作成を拒否する。
  files.delete(path);
  await clickNamed(host, "ファイル");
  await clickNamed(host, label);
  expect(files.has(selectedPath)).toBe(false);
  expect(host.querySelectorAll('[role="tab"]')).toHaveLength(1);
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("開いている文書と同じパス");
  if (kind === "model") {
    expect(host.querySelector("textarea")?.value).toBe("// draft");
    return;
  }
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test.each(["model", "canvas"])("保存先選択後に競合した %s ファイルを保護しタブを追加しない", async (kind) => {
  const path = kind === "model" ? "/existing.dmodel" : "/existing.dcanvas";
  const files = new Map<string, string>();
  mockIPC((command) => {
    if (command === "save_file_dialog") {
      files.set(path, "other process contents");
      return path;
    }
    expect(command).toBe("create_file");
    return { type: "err", error: { kind: "writeFailed", path, message: "already exists" } };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, kind === "model" ? "新規ドメインモデル" : "新規キャンバス");
  expect(files.get(path)).toBe("other process contents");
  expect(host.querySelector('[role="tab"]')).toBeNull();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain("already exists");
});

test.each([
  { kind: "canvas", label: "新規キャンバス", path: "/new.dcanvas", contents: Serialize.stringify(Document.empty()) },
  { kind: "model", label: "新規ドメインモデル", path: "/new.dmodel", contents: "" },
])("$label からファイルを作成し編集画面を開く", async ({ kind, label, path, contents }) => {
  const files = new Map<string, string>();
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      expect(payload).toEqual({ kind });
      return path;
    }
    expect(command).toBe("create_file");
    expect(payload).toEqual({ path, contents });
    files.set(path, contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, label);
  expect(files.get(path)).toBe(contents);
  expect(host.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain("new.");
  const editorLabel = kind === "model" ? "ドメインモデルのテキスト" : "部品パレット";
  expect(host.querySelector(`[aria-label="${editorLabel}"]`)).not.toBeNull();
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("保存ダイアログをキャンセルすると書き込まず文書なしのままになる", async () => {
  mockIPC((command) => {
    expect(command).toBe("save_file_dialog");
    return null;
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  expect(host.querySelector('[role="tab"]')).toBeNull();
  expect(host.textContent).toContain("文書が開かれていません");
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test.each(["dialog", "write"])("%s の失敗を表示し、再操作で新規作成できる", async (failure) => {
  let shouldFail = true;
  mockIPC((command) => {
    if (command === "save_file_dialog") {
      if (failure === "dialog" && shouldFail) { throw new Error("dialog unavailable"); }
      return "/retry.dmodel";
    }
    expect(command).toBe("create_file");
    if (shouldFail) { throw new Error("permission denied"); }
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  expect(host.querySelector('[role="tab"]')).toBeNull();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain(
    failure === "dialog" ? "dialog unavailable" : "permission denied",
  );
  expect(host.querySelector('[role="alert"]')?.textContent).not.toContain("Error:");
  shouldFail = false;
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  expect(host.querySelector('[role="tab"]')?.textContent).toContain("retry.dmodel");
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("保存先を選択中は両方の新規作成操作を無効にする", async () => {
  let cancel: (value: null) => void = () => {};
  let dialogCount = 0;
  mockIPC(() => {
    dialogCount += 1;
    return new Promise<null>((resolve) => { cancel = resolve; });
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  await clickNamed(host, "ファイル");
  const buttons = Array.from(host.querySelectorAll("button")).filter(
    (button) => button.textContent?.startsWith("新規"),
  );
  expect(buttons).toHaveLength(2);
  expect(buttons.every((button) => button.getAttribute("aria-disabled") === "true")).toBe(true);
  for (const button of buttons) {
    button.focus();
    expect(document.activeElement).toBe(button);
    await act(async () => button.click());
  }
  expect(dialogCount).toBe(1);
  await act(async () => cancel(null));
  expect(buttons.every((button) => button.getAttribute("aria-disabled") === "false")).toBe(true);
});


test("モデルの入力内容は別の文書を作成してから戻っても保持される", async () => {
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
  const input = host.querySelector("textarea");
  expect(input).toBeInstanceOf(HTMLTextAreaElement);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(input, "// draft");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  const modelTab = Array.from(host.querySelectorAll<HTMLButtonElement>('[role="tab"]')).find(
    (tab) => tab.textContent?.includes("draft.dmodel"),
  );
  expect(modelTab).toBeDefined();
  await act(async () => modelTab?.click());
  expect(host.querySelector<HTMLTextAreaElement>('section:not([hidden]) textarea')?.value).toBe("// draft");
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
