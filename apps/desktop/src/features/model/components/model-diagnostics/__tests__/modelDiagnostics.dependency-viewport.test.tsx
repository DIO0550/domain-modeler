import { act } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { DiagramSurface } from "@/libs/diagram-surface";
import { ElementSize } from "@/libs/element-size";
import {
  fixedSizes,
  fixedSurface,
  diagramButton,
  diagramWheel,
  modelNode,
  scopeButton,
} from "../../dependency-view/__tests__/dependencyView.test-support";
import { setNativeTextareaValue } from "../../model-editor/__tests__/modelEditor.test-support";
import { createDiagnosticsRenderer } from "./modelDiagnostics.test-support";

const renderer = createDiagnosticsRenderer();

afterEach(() => {
  renderer.unmountAll();
  vi.restoreAllMocks();
});

test("パン・ズーム・フィット・再配置で本文とUndo/Redo対象が変わらない", () => {
  vi.spyOn(ElementSize, "observe").mockImplementation(fixedSizes);
  vi.spyOn(DiagramSurface, "observe").mockImplementation(fixedSurface);
  const source = "data A = B\ndata B = string\n";
  const edited = `${source}data C = int\n`;
  const changes: string[] = [];
  let controls: Readonly<{ undo?: () => void; redo?: () => void }> = {};
  const host = renderer.render(
    source,
    (text) => changes.push(text),
    (next) => {
      controls = next;
    },
  );
  const input = host.querySelector("textarea")!;
  act(() => {
    setNativeTextareaValue(input, edited);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => input.blur());
  act(() => controls.undo?.());
  expect(controls.redo).toBeDefined();
  const before = [...changes];
  const modelViews = host.querySelectorAll<HTMLButtonElement>(
    'nav[aria-label="モデルの表示"] button',
  );
  act(() => modelViews[1].click());
  diagramWheel(host.querySelector(".dependency-view__canvas")!, {
    deltaX: 80,
    deltaY: 40,
  });
  act(() => diagramButton(host, "拡大").click());
  act(() => modelNode(host, "A").click());
  act(() => scopeButton(host, "関連のみ").click());
  act(() => diagramButton(host, "全体に合わせる").click());
  act(() => diagramButton(host, "再配置").click());
  act(() => scopeButton(host, "全体").click());

  expect(changes).toEqual(before);
  expect(controls.undo).toBeUndefined();
  expect(controls.redo).toBeDefined();
  act(() => controls.redo?.());
  expect(changes[changes.length - 1]).toBe(edited);
  act(() => modelViews[0].click());
  expect(host.querySelector("textarea")!.value).toBe(edited);
});
