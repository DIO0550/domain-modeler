import { mockIPC, mockWindows } from "@tauri-apps/api/mocks";
import { expect } from "vitest";

export const setupAppWindow = () => {
  const listeners = new Set<number>();
  const destroyedWindows: string[] = [];

  mockWindows("main");
  mockIPC((command, payload) => {
    const args = payload as Record<string, unknown>;

    if (command === "plugin:event|listen") {
      expect(args.event).toBe("tauri://close-requested");
      expect(args.target).toEqual({ kind: "Window", label: "main" });
      expect(typeof args.handler).toBe("number");
      const id = Number(args.handler);
      listeners.add(id);

      return id;
    }

    if (command === "plugin:event|unlisten") {
      expect(args.event).toBe("tauri://close-requested");
      listeners.delete(Number(args.eventId));

      return;
    }

    if (command === "plugin:window|destroy") {
      expect(typeof args.label).toBe("string");
      destroyedWindows.push(String(args.label));

      return;
    }

    throw new Error(`想定外のIPC: ${command}`);
  });

  return {
    destroyedWindows,
    requestClose: async () => {
      const internals = Reflect.get(window, "__TAURI_INTERNALS__");
      const callbacks: Map<number, unknown> = Reflect.get(
        internals,
        "callbacks",
      );

      // runCallback は戻り値を捨てるため、登録済みコールバックの完了まで直接待つ。
      await Promise.all(
        [...listeners].map(async (id) => {
          const callback = callbacks.get(id);

          if (typeof callback !== "function") {
            throw new Error("終了イベントのコールバックが登録されていない");
          }

          await callback({
            event: "tauri://close-requested",
            id,
            payload: null,
          });
        }),
      );
    },
  };
};

export const setupPendingSave = () => {
  let complete = (_saved: boolean) => {};
  const promise = new Promise<boolean>((resolve) => {
    complete = resolve;
  });

  return { promise, complete };
};
