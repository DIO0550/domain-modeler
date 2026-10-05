import { AnalyzedModel } from "../../analyzed-model";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachinePlacement } from "../../state-machine-placement";
import { Result } from "@domain-modeler/canvas-core";

export const machine = (text: string) =>
  AnalyzedModel.create(text).stateMachines[0]!;

export const position = (text: string, name: string) =>
  Result.unwrap(StateMachinePlacement.layout(text, machine(text))).nodes[
    StateMachineGraph.stateSelection(name).id
  ];
