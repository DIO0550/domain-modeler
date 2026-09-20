import { mockIPC } from "@tauri-apps/api/mocks";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect } from "vitest";
import App from "../../App";

const cleanups: (() => void)[] = [];

/** 描画した App を後片付けする。 */
export const cleanupApps = (): void => {
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
};

/** 実際のAppを描画する。外部I/Oだけを各テストで差し替える。 */
export const renderApp = (): HTMLElement => {
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

/** IPC command ごとの応答。payload は command 固有のため unknown で受ける。 */
export type CommandHandlers = Readonly<
  Record<string, (payload: unknown) => unknown>
>;

/**
 * command ごとの応答を差し込む。登録していない command が来たらテストを落とす。
 *
 * @param handlers command 名から応答を引く表。
 */
export const mockCommands = (handlers: CommandHandlers): void => {
  mockIPC((command, payload) => {
    const handler = handlers[command];
    if (handler === undefined) {
      throw new Error(`想定していないIPCを呼び出しました: ${command}`);
    }
    return handler(payload);
  });
};

/** 書き込み系 command の payload。 */
export type FilePayload = Readonly<{ path: string; contents: string }>;

/** payload を書き込み内容として読む。 */
export const filePayload = (payload: unknown): FilePayload =>
  payload as FilePayload;

/** メニューまたはタブのボタンを表示名で押す。 */
export const clickNamed = async (
  host: HTMLElement,
  name: string,
): Promise<void> => {
  const button = Array.from(host.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === name,
  );
  expect(button).toBeDefined();
  await act(async () => button?.click());
};

/** ファイルメニューから新規文書を作る。 */
export const newDocument = async (
  host: HTMLElement,
  kind: "model" | "canvas",
): Promise<void> => {
  await clickNamed(host, "ファイル");
  await clickNamed(
    host,
    kind === "model" ? "新規ドメインモデル" : "新規キャンバス",
  );
};

/** モデルエディタへ入力する。 */
export const editModel = async (
  host: HTMLElement,
  text: string,
): Promise<void> => {
  const input = host.querySelector("textarea");
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set?.call(input, text);
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

/** 保存ショートカットを送る。 */
export const saveShortcut = async (): Promise<void> => {
  await act(async () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }),
    ),
  );
};

/** 初回保存のどの段階を失敗させるか。 */
export type FirstSaveFailure = "dialog" | "write";

/**
 * 初回保存の1段階だけを失敗させ、後から成功へ切り替えられる IPC を差し込む。
 *
 * @param failure 失敗させる段階。
 * @param path 成功時に選ばれる保存先。
 * @returns 以後の保存を成功させる操作と、表示されるエラー文言。
 */
export const mockRetryableFirstSave = (
  failure: FirstSaveFailure,
  path: string,
): Readonly<{ succeed: () => void; message: string }> => {
  const state = { shouldFail: true };
  const message =
    failure === "dialog" ? "dialog unavailable" : "permission denied";
  mockCommands({
    save_file_dialog: () => {
      if (failure === "dialog" && state.shouldFail) {
        throw new Error(message);
      }
      return path;
    },
    create_file: () => {
      if (failure === "write" && state.shouldFail) {
        throw new Error(message);
      }
      return { type: "ok" };
    },
  });
  return {
    succeed: () => {
      state.shouldFail = false;
    },
    message,
  };
};
