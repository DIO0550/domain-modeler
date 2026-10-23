import { bench } from "vitest";
import { AnalyzedModel } from "../../../domains/analyzed-model";
import { DependencyDiagram } from "../../../domains/dependency-diagram";
import { ModelGraphLayout } from "../../../domains/model-graph-layout";
import { Result } from "@domain-modeler/model-core";
import { dependencyPerformanceSource } from "./dependency-performance.test-support";

// DOM描画・フォント計測・OSのI/Oを含まないCPU区間。表示応答の測定とは区別する。
for (const groups of [1, 10, 50]) {
  const source = dependencyPerformanceSource(groups);

  bench(
    `${groups * 10}宣言: 解析・参照解決・カード・固定寸法配置`,
    () => {
      const diagram = DependencyDiagram.create(AnalyzedModel.create(source));
      const sizes = new Map(
        diagram.cards.map((card) => [card.id, { width: 280, height: 220 }]),
      );

      const layout = ModelGraphLayout.create(diagram.graph, sizes);

      if (Result.isErr(layout)) {
        throw new Error(layout.error);
      }
    },
    { time: 500, warmupTime: 200 },
  );
}
