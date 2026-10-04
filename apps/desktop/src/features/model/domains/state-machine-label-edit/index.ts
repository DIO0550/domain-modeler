import type { StateMachineResolution } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { StateMachineGraph, type StateMachineGraphSelection } from "../state-machine-graph";
import type { StateMachineLayout } from "../state-machine-layout";
import { StateMachinePlacement } from "../state-machine-placement";
import type { StateMachinePosition } from "../state-machine-position";

/** 図上の入力を開いた時点の名前・表示位置と、確定後に選択する対象。 */
export type StateMachineLabelEdit = Readonly<{
  selection: StateMachineGraphSelection;
  point: StateMachinePosition;
  value: string;
}> & (Readonly<{ kind: "state" }> | Readonly<{ kind: "event"; from: string; to: string }>);

export const StateMachineLabelEdit = {
  create(context: Readonly<{ graph: StateMachineGraph; layout: StateMachineLayout; resolution: StateMachineResolution }>,
    selection: StateMachineGraphSelection): Option<StateMachineLabelEdit> {
    const inspection = StateMachineGraph.inspect(context.graph, selection);
    if (inspection.kind === "node") {
      const point = context.layout.nodes[inspection.node.id];
      if (point === undefined || !StateMachinePlacement.isMovable(context.resolution, inspection.node.name)) {
        return Option.none();
      }
      return Option.some({ kind: "state", selection, point, value: inspection.node.name });
    }
    if (inspection.kind === "edge") {
      const edge = context.layout.edges.find((item) => item.id === inspection.edge.id);
      if (edge === undefined) {
        return Option.none();
      }
      return Option.some({ kind: "event", selection, point: edge.label, value: inspection.edge.event,
        from: inspection.fromName, to: inspection.toName });
    }
    return Option.none();
  },
  renamedSelection(edit: StateMachineLabelEdit, value: string): StateMachineGraphSelection {
    if (edit.kind === "state") {
      return StateMachineGraph.stateSelection(value);
    }
    return StateMachineGraph.transitionSelection({ from: edit.from, to: edit.to, event: value });
  },
} as const;
