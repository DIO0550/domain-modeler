import { vi } from "vitest";
import {
  filePayload,
  mockCommands,
  renderApp,
} from "./newDocument.test-support";

/** 初回保存のIPCとDOM寸法だけを代替し、実際のAppを描画する。 */
export function renderDependencyApp() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, 0, 1000, 700),
  );
  const files = new Map<string, string>();
  const storage = { failure: false };

  mockCommands({
    save_file_dialog: () => "/new.dmodel",
    create_file: (payload) => {
      if (storage.failure) {
        return {
          type: "err",
          error: {
            kind: "writeFailed",
            path: "/new.dmodel",
            message: "保存失敗の検証",
          },
        };
      }

      const file = filePayload(payload);
      files.set(file.path, file.contents);

      return { type: "ok" };
    },
  });

  return { host: renderApp(), files, storage };
}

/** 画面上の参照方向と役割を保存・再読込の前後で比較する。 */
export function dependencyRelations(host: HTMLElement) {
  return [...host.querySelectorAll(".dependency-view__edges g")].map((edge) =>
    edge.getAttribute("aria-label"),
  );
}
