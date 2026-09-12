import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DataDecl } from "@domain-modeler/model-core";
import type { PreviewTypeRef } from "../../../domains/preview-type-ref";
import { PreviewDataCard } from "../index";

type RenderedCard = Readonly<{
  host: HTMLDivElement;
  unmount: () => void;
}>;

type CardRenderer = Readonly<{
  render: (
    decl: DataDecl,
    undefinedTypeNames?: ReadonlySet<string>,
    onTypeRefClick?: (typeRef: PreviewTypeRef) => void,
    onUndefinedBadgeClick?: (typeRef: PreviewTypeRef) => void,
    onRename?: (nextName: string) => void,
  ) => HTMLDivElement;
  unmountAll: () => void;
}>;

/**
 * テストファイルごとに独立したカード描画器を作る。
 * @returns 描画と一括破棄。
 */
export const createCardRenderer = (): CardRenderer => {
  const rendered: RenderedCard[] = [];
  return {
    render: (
      decl,
      undefinedTypeNames,
      onTypeRefClick,
      onUndefinedBadgeClick,
      onRename,
    ) => {
      const host = document.createElement("div");
      document.body.append(host);
      const root: Root = createRoot(host);
      act(() => {
        root.render(
          <PreviewDataCard
            decl={decl}
            undefinedTypeNames={undefinedTypeNames}
            onTypeRefClick={onTypeRefClick}
            onUndefinedBadgeClick={onUndefinedBadgeClick}
            onRename={onRename}
          />,
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
