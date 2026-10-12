import { createContext, useContext, type ReactNode } from "react";
import type { SourceRange } from "@domain-modeler/model-core";
import { ElementSize } from "@/libs/element-size";
import { Option } from "@/utils/Option";
import type { AnalyzedModel } from "../../../domains/analyzed-model";
import { useDependencyView } from "../../../hooks/use-dependency-view";

type DependencyContextValue = Readonly<{
  view: ReturnType<typeof useDependencyView>;
  onEditSource: (range?: SourceRange) => void;
}>;

const DependencyContext = createContext<Option<DependencyContextValue>>(
  Option.none(),
);

/**
 * 同じ画面内の図とインスペクターが状態を参照する。
 * @returns 依存図の状態。Rootの外では不在。
 */
export function useDependencyContext(): Option<DependencyContextValue> {
  return useContext(DependencyContext);
}

/**
 * 図とインスペクターで計測結果・選択状態を共有する。
 * @param props 解析結果、定義画面への移動、子要素と計測境界。
 * @returns モデル依存図の画面領域。
 */
export function DependencyRoot({
  analyzed,
  onEditSource,
  observeSizes = ElementSize.observe,
  children,
}: Readonly<{
  analyzed: AnalyzedModel;
  onEditSource: (range?: SourceRange) => void;
  observeSizes?: typeof ElementSize.observe;
  children: ReactNode;
}>) {
  const view = useDependencyView({ analyzed, observeSizes });

  return (
    <DependencyContext.Provider value={Option.some({ view, onEditSource })}>
      <div className="dependency-view">{children}</div>
    </DependencyContext.Provider>
  );
}
