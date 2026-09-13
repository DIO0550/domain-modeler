import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  useDeclNameEdit,
  type UseDeclNameEditResult,
} from "..";

type RenderedHook = Readonly<{
  latest: { current: UseDeclNameEditResult | undefined };
  unmount: () => void;
}>;

/**
 * 宣言名編集フックを描画して最新の戻り値を取り出す。
 *
 * @returns 描画関数と一括 unmount。
 */
export const createDeclNameEditRenderer = () => {
  const rendered: RenderedHook[] = [];

  return {
    render: (
      name: string,
      onRename?: (nextName: string) => void,
    ): { current: UseDeclNameEditResult | undefined } => {
      const latest: { current: UseDeclNameEditResult | undefined } = {
        current: undefined,
      };
      const host = document.createElement("div");
      document.body.append(host);
      const root: Root = createRoot(host);

      const Probe = () => {
        latest.current = useDeclNameEdit({ name, onRename });
        return null;
      };

      act(() => {
        root.render(<Probe />);
      });

      rendered.push({
        latest,
        unmount: () => {
          act(() => {
            root.unmount();
          });
          host.remove();
        },
      });
      return latest;
    },
    unmountAll: () => {
      for (const entry of rendered.splice(0)) {
        entry.unmount();
      }
    },
  };
};
