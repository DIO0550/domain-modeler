import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { type AutoSaveOperations } from "../../domains";
import {
  AutoSaveProvider,
  useAutoSave,
  type AutoSaveContextValue,
} from "../index";

export type WriteCall = Readonly<{ path: string; contents: string }>;

export type AutoSaveProbe = Readonly<{
  latest: { current: AutoSaveContextValue | undefined };
  rerender: (next: { path: string; initialContents: string }) => void;
  unmount: () => void;
}>;

/**
 * 呼び出し履歴を記録する自動保存用の外部操作を組み立てる。
 *
 * @param writes ファイル書き込みの呼び出し履歴。
 * @returns テスト用の自動保存操作。
 */
export const operationsRecording = (writes: WriteCall[]): AutoSaveOperations => ({
  writeFile: async (path, contents) => {
    writes.push({ path, contents });
    return { type: "ok" };
  },
  now: () => Date.now(),
});

/**
 * Provider 配下の自動保存操作を参照できるテスト用ツリーを描画する。
 *
 * @param operations ファイル書き込みと時刻取得。
 * @returns 最新の Context 値、再描画、unmount。
 */
export const renderAutoSave = (operations: AutoSaveOperations): AutoSaveProbe => {
  const latest: { current: AutoSaveContextValue | undefined } = {
    current: undefined,
  };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  const Probe = () => {
    latest.current = useAutoSave();
    return null;
  };

  const renderProvider = (next: { path: string; initialContents: string }) => {
    act(() => {
      root.render(
        <AutoSaveProvider
          path={next.path}
          initialContents={next.initialContents}
          operations={operations}
        >
          <Probe />
        </AutoSaveProvider>,
      );
    });
  };

  renderProvider({
    path: "/documents/context.dcanvas",
    initialContents: "{}",
  });

  return {
    latest,
    rerender: renderProvider,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
};

/**
 * 1回目の書き込みだけを保留し、2回目以降は即座に成功させる外部操作を組み立てる。
 *
 * @param writes ファイル書き込みの呼び出し履歴。
 * @returns テスト用の自動保存操作と、保留中の1回目を完了させる操作。
 */
export const operationsBlockingFirstWrite = (
  writes: WriteCall[],
): Readonly<{ operations: AutoSaveOperations; finish: () => void }> => {
  const pending = { finish: () => {} };
  return {
    operations: {
      writeFile: async (path, contents) => {
        writes.push({ path, contents });
        if (writes.length > 1) {
          return { type: "ok" };
        }
        return await new Promise((resolve) => {
          pending.finish = () => resolve({ type: "ok" });
        });
      },
      now: () => Date.now(),
    },
    finish: () => pending.finish(),
  };
};
