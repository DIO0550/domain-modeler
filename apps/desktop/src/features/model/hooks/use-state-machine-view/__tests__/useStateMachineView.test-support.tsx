import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useStateMachineView, type UseStateMachineViewResult } from "..";

type HookSession = Readonly<{
  latest: { current: UseStateMachineViewResult | undefined };
  replaceSource: (source: string) => void;
}>;
type RenderedHook = Readonly<{ root: Root; host: HTMLDivElement }>;

/** 文書の更新を再描画に反映し、表示状態の hook を検証する。 */
export const createStateMachineViewRenderer = () => {
  const rendered: RenderedHook[] = [];
  return {
    render(initialSource: string): HookSession {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const latest: HookSession["latest"] = { current: undefined };
      const Probe = ({ source }: Readonly<{ source: string }>) => {
        latest.current = useStateMachineView(source);
        return null;
      };
      act(() => root.render(<Probe source={initialSource} />));
      rendered.push({ root, host });
      return {
        latest,
        replaceSource: (source) => act(() => root.render(<Probe source={source} />)),
      };
    },
    unmountAll: () => {
      for (const entry of rendered.splice(0)) {
        act(() => entry.root.unmount());
        entry.host.remove();
      }
    },
  };
};
