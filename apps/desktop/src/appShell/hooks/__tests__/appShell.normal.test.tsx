import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, test } from "vitest";
import { useAppShell, type UseAppShellResult } from "..";

type AppShellProbe = Readonly<{
  latest: { current: UseAppShellResult | undefined };
  unmount: () => void;
}>;

const probes: AppShellProbe[] = [];

afterEach(() => {
  for (const probe of probes.splice(0)) {
    probe.unmount();
  }
});

/**
 * useAppShell の公開APIを参照できるテスト用ツリーを描画する。
 *
 * @returns 最新の hook 戻り値と unmount。
 */
const renderAppShell = (): AppShellProbe => {
  const latest: { current: UseAppShellResult | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    latest.current = useAppShell();
    return null;
  };

  act(() => {
    root.render(<Probe />);
  });

  const probe = {
    latest,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
  probes.push(probe);
  return probe;
};

test("初期状態は文書なしで閉じる・undo・redo・生成が無効になる", () => {
  const probe = renderAppShell();

  expect(probe.latest.current?.tabsState).toEqual({
    status: "empty",
    tabs: [],
  });
  expect(probe.latest.current?.menuState).toEqual({
    newCanvas: "enabled",
    newModel: "enabled",
    open: "enabled",
    closeTab: "disabled",
    undo: "disabled",
    redo: "disabled",
    generateFromCanvas: "disabled",
  });
});

test("文書が無いときタブを閉じるコマンドを実行しても空のままになる", () => {
  const probe = renderAppShell();

  act(() => {
    probe.latest.current?.runCommand("closeTab");
  });

  expect(probe.latest.current?.tabsState.status).toBe("empty");
});
