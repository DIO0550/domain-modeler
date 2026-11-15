import { Result } from "@domain-modeler/model-core";
import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachinePlacement } from "../../state-machine-placement";

export const setupLabelContext = (
  source = `state-machine 注文 =
  initial: 待機
  state: 待機 // @canvas-position(v1, -20, 200)
  state: 完了 terminal // @canvas-position(v1, 500, 200)
  transition: 待機 -> 完了 on 確定`,
) => {
  const resolution = AnalyzedModel.create(source).stateMachines[0];

  return {
    resolution,
    graph: StateMachineGraph.create(resolution, []),
    layout: Result.unwrap(StateMachinePlacement.layout(source, resolution)),
  };
};
