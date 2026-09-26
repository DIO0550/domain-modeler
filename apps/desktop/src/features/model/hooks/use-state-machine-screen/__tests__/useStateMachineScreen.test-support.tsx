import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useStateMachineScreen, type UseStateMachineScreenResult } from "..";

type HookSession = Readonly<{
  latest: { current: UseStateMachineScreenResult | undefined };
  source: () => string;
  replaceSource: (next: string) => void;
}>;

type RenderedHook = Readonly<{ root: Root; host: HTMLDivElement }>;

/** hook と親から渡す `.dmodel` 全文を一緒に描画する。 */
export const createStateMachineScreenRenderer = () => {
  const rendered: RenderedHook[] = [];
  return {
    render(initialSource: string): HookSession {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const latest: HookSession["latest"] = { current: undefined };
      let source = initialSource;
      const Probe = ({ value }: Readonly<{ value: string }>) => {
        latest.current = useStateMachineScreen({
          value,
          onChange: (next) => {
            source = next;
            root.render(<Probe value={source} />);
          },
        });
        return null;
      };
      act(() => root.render(<Probe value={source} />));
      rendered.push({ root, host });
      return {
        latest,
        source: () => source,
        replaceSource: (next) => {
          source = next;
          act(() => root.render(<Probe value={source} />));
        },
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
