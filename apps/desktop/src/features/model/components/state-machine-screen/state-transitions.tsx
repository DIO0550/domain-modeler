import {
  StateMachineGraph,
  type StateMachineGraphSelection,
} from "../../domains/state-machine-graph";

type Node = StateMachineGraph["nodes"][number];
type Edge = StateMachineGraph["edges"][number];

type StateTransitionsProps = Readonly<{
  graph: StateMachineGraph;
  node: Node;
  onSelect: (selection: StateMachineGraphSelection) => void;
  onAddTransition: () => void;
}>;

function TransitionList({ title, edges, labelOf, onSelect }: Readonly<{
  title: string;
  edges: readonly Edge[];
  labelOf: (edge: Edge) => string;
  onSelect: (selection: StateMachineGraphSelection) => void;
}>) {
  return <section aria-label={title}>
    <h3>{title}</h3>
    {edges.length === 0
      ? <p>なし</p>
      : <ul>
        {edges.map((edge) => <li key={edge.id}>
          <button type="button" onClick={() => onSelect({ kind: "edge", id: edge.id })}>{labelOf(edge)}</button>
        </li>)}
      </ul>}
  </section>;
}

/** 選択した状態に出入りする遷移の一覧と、その状態を起点にした遷移の追加。 */
export function StateMachineStateTransitions({ graph, node, onSelect, onAddTransition }: StateTransitionsProps) {
  const { incoming, outgoing } = StateMachineGraph.transitionsOf(graph, node.id);
  const nameOf = (edge: Edge) => StateMachineGraph.endpoints(graph, edge);
  const addable = node.appearance !== "unresolved" && !node.appearance.includes("terminal");
  return <div className="state-machine-screen__transitions">
    <TransitionList title="出ていく遷移" edges={outgoing} onSelect={onSelect}
      labelOf={(edge) => `${edge.event} → ${nameOf(edge).to}`} />
    <TransitionList title="入ってくる遷移" edges={incoming} onSelect={onSelect}
      labelOf={(edge) => `${edge.event} ← ${nameOf(edge).from}`} />
    {addable && <button type="button" onClick={onAddTransition}>この状態から遷移を追加</button>}
  </div>;
}
