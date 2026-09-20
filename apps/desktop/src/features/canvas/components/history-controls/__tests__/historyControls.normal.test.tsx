import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { HistoryButton, HistoryControls } from "../index";

type RenderedControls = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

const rendered: RenderedControls[] = [];

afterEach(() => {
  for (const entry of rendered.splice(0)) {
    entry.unmount();
  }
});

const renderControls = (
  value: React.ComponentProps<typeof HistoryControls>["value"],
): HTMLDivElement => {
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);
  act(() => {
    root.render(<HistoryControls value={value} />);
  });
  rendered.push({
    host,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  });
  return host;
};

test("履歴操作はアイコンのアクセシブルな名前とショートカットのツールチップを持つ", () => {
  const host = renderControls({
    undo: HistoryButton.enabled(() => {}),
    redo: HistoryButton.enabled(() => {}),
  });

  const undo = host.querySelector<HTMLButtonElement>(
    'button[aria-label="元に戻す"]',
  );
  const redo = host.querySelector<HTMLButtonElement>(
    'button[aria-label="やり直す"]',
  );

  expect(undo?.title).toContain("元に戻す");
  expect(redo?.title).toContain("やり直す");
  expect(undo?.querySelector("svg")).not.toBeNull();
  expect(redo?.querySelector("svg")).not.toBeNull();
});

test("実行できない履歴操作は無効なボタンになる", () => {
  const host = renderControls({
    undo: HistoryButton.disabled(),
    redo: HistoryButton.disabled(),
  });

  expect(host.querySelector<HTMLButtonElement>('button[aria-label="元に戻す"]')?.disabled).toBe(
    true,
  );
  expect(host.querySelector<HTMLButtonElement>('button[aria-label="やり直す"]')?.disabled).toBe(
    true,
  );
});

test("実行可能な履歴操作を押すと対象のハンドラを呼ぶ", () => {
  const clicked: string[] = [];
  const host = renderControls({
    undo: HistoryButton.enabled(() => clicked.push("undo")),
    redo: HistoryButton.enabled(() => clicked.push("redo")),
  });

  act(() => {
    host.querySelector<HTMLButtonElement>('button[aria-label="元に戻す"]')?.click();
    host.querySelector<HTMLButtonElement>('button[aria-label="やり直す"]')?.click();
  });

  expect(clicked).toEqual(["undo", "redo"]);
});
