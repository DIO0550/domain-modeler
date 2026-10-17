import { act } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";
import { DiagramSurface } from "@/libs/diagram-surface";
import { ElementSize } from "@/libs/element-size";
import type { AutoSaveOperations } from "@/features/auto-save";
import type { FileWatchEvent, FileWatchOperations } from "@/libs/file-watch";
import { DocumentWorkspace } from "../document-workspace";
import { TabsState } from "../tabs";

const cleanups: (() => void)[] = [];

export function cleanupDependencyWorkspaces() {
  cleanups.splice(0).forEach((cleanup) => cleanup());
}

/** 文書・解析・履歴・保存・外部変更を実物で接続し、ファイルとDOM計測だけを代替する。 */
export async function openDependencyWorkspace(
  files: Map<string, string>,
  options: Readonly<{ delayMeasurements?: boolean }> = {},
) {
  const measurements: Readonly<{
    report: Parameters<typeof ElementSize.observe>[1];
    sizes: Parameters<Parameters<typeof ElementSize.observe>[1]>[0];
  }>[] = [];
  vi.spyOn(ElementSize, "observe").mockImplementation((container, report) => {
    const sizes = new Map(
      [...container.querySelectorAll<HTMLElement>("[data-measure-node]")].map(
        (element) => [
          element.dataset.measureNode!,
          { width: 280, height: 180 },
        ],
      ),
    );
    measurements.push({ report, sizes });

    if (!options.delayMeasurements) {
      report(sizes);
    }

    return () => undefined;
  });
  vi.spyOn(DiagramSurface, "observe").mockImplementation((_element, report) => {
    report({ width: 1000, height: 700 });

    return () => undefined;
  });
  const listeners = new Map<string, (event: FileWatchEvent) => void>();
  const failures = new Map<
    string,
    Extract<
      Awaited<ReturnType<FileWatchOperations["readFile"]>>,
      { type: "err" }
    >["error"]
  >();
  const fileWatchOperations: FileWatchOperations = {
    watch: async (path, notify) => {
      listeners.set(path, notify);

      return {
        type: "ok",
        stop: async () => {
          listeners.delete(path);
        },
      };
    },
    readFile: async (path) => {
      const error = failures.get(path);

      return error === undefined
        ? { type: "ok", value: files.get(path)! }
        : { type: "err", error };
    },
  };
  const autoSaveOperations: AutoSaveOperations = {
    writeFile: async (path, contents) => {
      files.set(path, contents);

      return { type: "ok" };
    },
    now: () => performance.now(),
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  let tabs = [...files.keys()].reduce(
    (state, path) =>
      TabsState.reducer(state, {
        type: "openTab",
        path,
        documentType: "model",
      }),
    TabsState.create(),
  );
  const render = async () => {
    await act(async () =>
      root.render(
        <DocumentWorkspace
          tabsState={tabs}
          fileWatchOperations={fileWatchOperations}
          autoSaveOperations={autoSaveOperations}
          dispatchExternalFileAction={() => undefined}
        />,
      ),
    );
  };
  const changed = async (path: string) => {
    await act(async () => {
      listeners.get(path)!({ type: "changed", path });
      await Promise.resolve();
    });
  };

  await render();

  for (const path of files.keys()) {
    await changed(path);
  }

  cleanups.push(() => {
    act(() => root.unmount());
    host.remove();
  });

  return {
    host,
    changed,
    failures,
    active: () =>
      host.querySelector<HTMLElement>(
        ".document-workspace__document:not([hidden])",
      )!,
    activate: async (path: string) => {
      tabs = TabsState.reducer(tabs, { type: "activateTab", path });
      await render();
    },
    measure: (index = measurements.length - 1) => {
      const measurement = measurements[index];
      act(() => measurement.report(measurement.sizes));
    },
  };
}

/** 現在の画面の名前付きボタンをユーザー操作として押す。 */
export async function clickDependencyButton(host: HTMLElement, name: string) {
  const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) =>
      item.textContent === name || item.getAttribute("aria-label") === name,
  )!;
  await act(async () => button.click());
}

export function dependencyNode(host: HTMLElement, name: string) {
  return [...host.querySelectorAll<HTMLElement>("[data-node-id]")].find(
    (node) =>
      node.querySelector(".dependency-view__name")?.textContent === name,
  )!;
}

export function dependencyNames(host: HTMLElement) {
  return [
    ...host.querySelectorAll("[data-node-id] .dependency-view__name"),
  ].map((node) => node.textContent);
}

export function dependencyTransform(host: HTMLElement) {
  return host.querySelector<HTMLElement>(".dependency-view__drawing")!.style
    .transform;
}

export function panDependency(host: HTMLElement) {
  act(() =>
    host
      .querySelector(".dependency-view__canvas")!
      .dispatchEvent(
        new WheelEvent("wheel", {
          deltaX: 500,
          deltaY: 400,
          bubbles: true,
          cancelable: true,
        }),
      ),
  );
}

export async function dependencyHistory(host: HTMLElement, redo = false) {
  await act(async () =>
    host
      .querySelector(".model-diagnostics-workspace")!
      .dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "z",
          ctrlKey: true,
          shiftKey: redo,
          bubbles: true,
          cancelable: true,
        }),
      ),
  );
}
