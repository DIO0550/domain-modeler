import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AutoSaveOperations } from "@/features/auto-save";
import type { FileWatchEvent, FileWatchOperations } from "@/libs/file-watch";
import { DocumentWorkspace } from "../document-workspace";
import { TabsState } from "../tabs";

type Workspace = Readonly<{
  host: HTMLDivElement;
  files: Map<string, string>;
  changed: (path: string) => Promise<void>;
  close: () => void;
}>;

/** 実文書領域と自動保存を使い、ファイル監視境界だけメモリ上で代替する。 */
export const openModelWorkspace = (
  path: string,
  files: Map<string, string>,
): Workspace => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);
  const listeners = new Map<string, (event: FileWatchEvent) => void>();
  const fileWatchOperations: FileWatchOperations = {
    watch: async (watchedPath, onEvent) => {
      listeners.set(watchedPath, onEvent);
      return {
        type: "ok",
        stop: async () => {
          listeners.delete(watchedPath);
        },
      };
    },
    readFile: async (readPath) => ({
      type: "ok",
      value: files.get(readPath) ?? "",
    }),
  };
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (writePath, contents) => {
      files.set(writePath, contents);
      return { type: "ok" };
    },
    now: () => performance.now(),
  };
  const tabsState = TabsState.reducer(TabsState.create(), {
    type: "openTab",
    path,
    documentType: "model",
  });
  act(() =>
    root.render(
      <DocumentWorkspace
        tabsState={tabsState}
        autoSaveOperations={autoSaveOperations}
        fileWatchOperations={fileWatchOperations}
        dispatchExternalFileAction={() => {}}
      />,
    ),
  );
  return {
    host,
    files,
    changed: async (changedPath) => {
      await act(async () => {
        listeners.get(changedPath)?.({ type: "changed", path: changedPath });
        await Promise.resolve();
      });
    },
    close: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
};
