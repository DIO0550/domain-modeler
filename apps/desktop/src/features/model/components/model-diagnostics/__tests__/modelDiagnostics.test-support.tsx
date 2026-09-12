import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ModelDiagnostics } from "../index";

type RenderedDiagnostics = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

type DiagnosticsRenderer = Readonly<{
  render: (value: string, onChange?: (text: string) => void) => HTMLDivElement;
  unmountAll: () => void;
}>;

/**
 * テストファイルごとに独立した診断画面描画器を作る。
 * @returns 描画と一括破棄。
 */
export const createDiagnosticsRenderer = (): DiagnosticsRenderer => {
  const rendered: RenderedDiagnostics[] = [];
  return {
    render: (value, onChange = () => undefined) => {
      const host = document.createElement("div");
      document.body.append(host);
      const root: Root = createRoot(host);
      let text = value;
      const handleChange = (next: string) => {
        text = next;
        onChange(next);
        act(() => {
          root.render(
            <ModelDiagnostics value={text} onChange={handleChange} />,
          );
        });
      };
      act(() => {
        root.render(
          <ModelDiagnostics value={text} onChange={handleChange} />,
        );
      });
      rendered.push({
        host,
        unmount: () => {
          act(() => {
            root.unmount();
          });
          host.remove();
        },
      });
      return host;
    },
    unmountAll: () => {
      for (const entry of rendered.splice(0)) {
        entry.unmount();
      }
    },
  };
};
