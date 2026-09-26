import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "..";

/** 実際のパーサと参照解決を通して先頭マシンのグラフを作る。 */
export const graphOf = (source: string): StateMachineGraph => {
  const analyzed = AnalyzedModel.create(source);
  const resolution = analyzed.stateMachines[0];
  if (resolution === undefined) {
    throw new Error("テスト文書に state-machine が必要です");
  }
  return StateMachineGraph.create(resolution, analyzed.diagnostics);
};
