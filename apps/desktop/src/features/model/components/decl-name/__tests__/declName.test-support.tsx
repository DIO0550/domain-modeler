import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DeclName } from "../index";

type RenderedName = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

type NameRenderer = Readonly<{
  render: (name: string, onRename?: (nextName: string) => void) => HTMLDivElement;
  unmountAll: () => void;
}>;

/**
 * テストファイルごとに独立した宣言名描画器を作る。
 *
 * @returns 描画と一括破棄。
 */
export const createNameRenderer = (): NameRenderer => {
  const rendered: RenderedName[] = [];
  return {
    render: (name, onRename) => {
      const host = document.createElement("div");
      document.body.append(host);
      const root: Root = createRoot(host);
      act(() => {
        root.render(
          <DeclName name={name} className="decl-name" onRename={onRename} />,
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
