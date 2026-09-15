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
    expect(command).toBe("write_file");
    expect(payload).toEqual({ path, contents });
    files.set(path, contents);
    return { type: "ok" };
  });
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, label);
  expect(files.get(path)).toBe(contents);
  expect(host.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain("new.");
  const editorLabel = kind === "model" ? "ドメインモデルのテキスト" : "キャンバスツール";
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
    expect(command).toBe("write_file");
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
  shouldFail = false;
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規ドメインモデル");
  expect(host.querySelector('[role="tab"]')?.textContent).toContain("retry.dmodel");
  expect(host.querySelector('[role="alert"]')).toBeNull();
});

test("保存先を選択中は両方の新規作成操作を無効にする", async () => {
  let cancel: (value: null) => void = () => {};
  mockIPC(() => new Promise<null>((resolve) => { cancel = resolve; }));
  const host = renderApp();
  await clickNamed(host, "ファイル");
  await clickNamed(host, "新規キャンバス");
  await clickNamed(host, "ファイル");
  const buttons = Array.from(host.querySelectorAll("button")).filter(
    (button) => button.textContent?.startsWith("新規"),
  );
  expect(buttons).toHaveLength(2);
  expect(buttons.every((button) => button.disabled)).toBe(true);
  await act(async () => cancel(null));
  expect(buttons.every((button) => !button.disabled)).toBe(true);
});


test("モデルの入力内容は別の文書を作成してから戻っても保持される", async () => {
  mockIPC((command, payload) => {
    if (command === "save_file_dialog") {
      const kind = (payload as { kind: string }).kind;
      return kind === "model" ? "/draft.dmodel" : "/board.dcanvas";
    }
    expect(command).toBe("write_file");
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
