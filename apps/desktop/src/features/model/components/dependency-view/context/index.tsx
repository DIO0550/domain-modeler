import { createContext, useContext, type ReactNode } from "react";
import type { SourceRange } from "@domain-modeler/model-core";
import { DiagramSurface } from "@/libs/diagram-surface";
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
 * 図とインスペクターで状態を共有し、非表示中も本文との対応を保つ。
 * @param props 解析結果、定義画面への移動、表示状態、子要素と計測境界。
 * @returns モデル依存図の画面領域。
 */
export function DependencyRoot({
  analyzed,
  onEditSource,
  observeSizes = ElementSize.observe,
  children,
  observeSurface,
  isVisible = true,
}: Readonly<{
  analyzed: AnalyzedModel;
  onEditSource: (range?: SourceRange) => void;
  observeSizes?: typeof ElementSize.observe;
  observeSurface?: typeof DiagramSurface.observe;
  children: ReactNode;
  isVisible?: boolean;
}>) {
  const view = useDependencyView({
    analyzed,
    observeSizes,
    observeSurface,
    isVisible,
  });

  return (
    <DependencyContext.Provider value={Option.some({ view, onEditSource })}>
      {isVisible && <div className="dependency-view">{children}</div>}
    </DependencyContext.Provider>
  );
}
