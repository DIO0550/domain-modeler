import { act } from "react";
import { expect, test } from "vitest";
import {
  diagramButton,
  diagramWheel,
  drawingTransform,
  fixedSurface,
  modelNode,
  renderDependency,
  scopeButton,
} from "./dependencyView.test-support";

const source = "data A = B\ndata B = string\ndata C = int\n";

test("拡大・縮小と現在対象へのフィットを操作できる", () => {
  const screen = renderDependency(source, { observeSurface: fixedSurface });
  const original = drawingTransform(screen.host);
  act(() => diagramButton(screen.host, "拡大").click());
  expect(drawingTransform(screen.host)).not.toBe(original);
  expect(screen.host.querySelector("output")!.textContent).toBe("120%");
  act(() => diagramButton(screen.host, "縮小").click());
  act(() => diagramButton(screen.host, "全体に合わせる").click());

  expect(drawingTransform(screen.host)).toBe(original);
  screen.unmount();
});

test("関連のみのフィット・再配置後でも全体のviewportと選択を復元する", () => {
  const screen = renderDependency(source, { observeSurface: fixedSurface });
  act(() => diagramButton(screen.host, "拡大").click());
  const original = drawingTransform(screen.host);
  act(() => modelNode(screen.host, "C").click());
  act(() => scopeButton(screen.host, "関連のみ").click());
  act(() => diagramButton(screen.host, "再配置").click());
  act(() => scopeButton(screen.host, "全体").click());

  expect(drawingTransform(screen.host)).toBe(original);
  expect(modelNode(screen.host, "C").getAttribute("aria-pressed")).toBe("true");
  screen.unmount();
});

test("倍率の上限と下限で対応するボタンを無効にする", () => {
  const screen = renderDependency(source, { observeSurface: fixedSurface });
  diagramWheel(screen.host.querySelector("section")!, {
    ctrlKey: true,
    deltaY: -100000,
  });
  expect(diagramButton(screen.host, "拡大").disabled).toBe(true);
  diagramWheel(screen.host.querySelector("section")!, {
    ctrlKey: true,
    deltaY: 100000,
  });

  expect(diagramButton(screen.host, "縮小").disabled).toBe(true);
  expect(screen.host.querySelector("output")!.textContent).toBe("10%");
  screen.unmount();
});

test.each([
  "",
  "data A = string\n",
])("空図や計測前はviewport操作を無効にする: %s", (text) => {
  const screen = renderDependency(text);

  expect(diagramButton(screen.host, "拡大").disabled).toBe(true);
  expect(diagramButton(screen.host, "全体に合わせる").disabled).toBe(true);
  screen.unmount();
});
