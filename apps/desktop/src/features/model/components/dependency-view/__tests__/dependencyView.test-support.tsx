import { act } from "react";
import { createRoot } from "react-dom/client";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import type { ElementSize } from "@/libs/element-size";
import type { SourceRange } from "@domain-modeler/model-core";
import { DependencyView } from "../index";

/** ブラウザの寸法計測境界だけを固定寸法に置き換える。 */
export const fixedSizes: typeof ElementSize.observe = (container, report) => {
  report(
    new Map(
      [...container.querySelectorAll<HTMLElement>("[data-measure-node]")].map(
        (element) => [
          element.dataset.measureNode!,
          { width: 280, height: 180 },
        ],
      ),
    ),
  );

  return () => undefined;
};

/** 最初の計測だけ失敗し、再試行で正常寸法を返すI/O境界。 */
export function createRetrySizes(): typeof ElementSize.observe {
  let attempt = 0;

  return (container, report) => {
    attempt += 1;

    if (attempt === 1) {
      report(new Map());

      return () => undefined;
    }

    return fixedSizes(container, report);
  };
}

export function renderDependency(
  source: string,
  options: Readonly<{
    observeSizes?: typeof ElementSize.observe;
    onEditSource?: (range?: SourceRange) => void;
  }> = {},
) {
  const host = document.createElement("div");

  document.body.append(host);

  const root = createRoot(host);
  const render = (value: string) => {
    act(() =>
      root.render(
        <DependencyView.Root
          analyzed={AnalyzedModel.create(value)}
          onEditSource={options.onEditSource ?? (() => undefined)}
          observeSizes={options.observeSizes ?? fixedSizes}
        >
          <DependencyView.Legend />
          <DependencyView.Graph />
          <DependencyView.Inspector />
          <DependencyView.Diagnostics />
        </DependencyView.Root>,
      ),
    );
  };

  render(source);

  return {
    host,
    render,
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}
