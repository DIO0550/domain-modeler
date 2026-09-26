import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useStateMachineDraft, type StateMachineDraftTarget, type UseStateMachineDraftResult } from "..";

type HookSession = Readonly<{
  latest: { current: UseStateMachineDraftResult | undefined };
  source: () => string;
}>;
type RenderedHook = Readonly<{ root: Root; host: HTMLDivElement }>;

/** 親に渡された全文が hook の確定通知で更新される検証用描画器。 */
export const createStateMachineDraftRenderer = () => {
  const rendered: RenderedHook[] = [];
  return {
    render(initialSource: string, target: StateMachineDraftTarget): HookSession {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const latest: HookSession["latest"] = { current: undefined };
      let source = initialSource;
      const Probe = ({ value }: Readonly<{ value: string }>) => {
        latest.current = useStateMachineDraft({
          source: value,
          target,
          onChange: (next) => {
            source = next;
            root.render(<Probe value={source} />);
          },
        });
        return null;
      };
      act(() => root.render(<Probe value={source} />));
      rendered.push({ root, host });
      return { latest, source: () => source };
    },
    unmountAll: () => {
      for (const entry of rendered.splice(0)) {
        act(() => entry.root.unmount());
        entry.host.remove();
      }
    },
  };
};
