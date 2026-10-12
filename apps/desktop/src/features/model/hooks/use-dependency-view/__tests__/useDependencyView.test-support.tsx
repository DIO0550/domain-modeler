import { act } from "react";
import { createRoot } from "react-dom/client";
import type { ElementSize } from "@/libs/element-size";
import { Option } from "@/utils/Option";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import { useDependencyView } from "..";

/** 計測完了を任意の順序で返すDOM境界で、実物のフックを描画する。 */
export function renderDependencyHook(
  source: string,
  options: Readonly<{ attachMeasurement?: boolean }> = {},
) {
  const activeSubscriptions = new Set<number>();
  const frames: Readonly<{
    report: Parameters<typeof ElementSize.observe>[1];
    sizes: Parameters<Parameters<typeof ElementSize.observe>[1]>[0];
  }>[] = [];
  const observeSizes: typeof ElementSize.observe = (container, report) => {
    const sizes = new Map(
      [...container.querySelectorAll<HTMLElement>("[data-measure-node]")].map(
        (element) => [
          element.dataset.measureNode!,
          { width: 280, height: 120 },
        ],
      ),
    );

    const subscription = frames.length;

    frames.push({ report, sizes });
    activeSubscriptions.add(subscription);

    return () => {
      activeSubscriptions.delete(subscription);
    };
  };
  let latest: Option<ReturnType<typeof useDependencyView>> = Option.none();

  function Probe({ analyzed }: Readonly<{ analyzed: AnalyzedModel }>) {
    const view = useDependencyView({ analyzed, observeSizes });

    latest = Option.some(view);

    return (
      <div
        ref={options.attachMeasurement === false ? undefined : view.measureRef}
      >
        {view.diagram.cards.map((card) => (
          <div key={card.id} data-measure-node={card.id} />
        ))}
      </div>
    );
  }

  const host = document.createElement("div");

  document.body.append(host);

  const root = createRoot(host);
  const render = (value: string) =>
    act(() => root.render(<Probe analyzed={AnalyzedModel.create(value)} />));

  render(source);

  return {
    subscriptionCount: () => activeSubscriptions.size,
    view: () => Option.unwrap(latest),
    render,
    publish: (
      params: Readonly<{
        frame?: number;
        sizes?: Parameters<Parameters<typeof ElementSize.observe>[1]>[0];
      }> = {},
    ) => {
      const frame = frames[params.frame ?? frames.length - 1];

      act(() => frame.report(params.sizes ?? frame.sizes));
    },
    unmount: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}
