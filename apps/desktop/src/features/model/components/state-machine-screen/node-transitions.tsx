import { useId } from "react";
import { StateMachineGraph } from "../../domains/state-machine-graph";
import { useStateMachineContext } from "./context";
import { focusGraph } from "./focus";

/**
 * 選択状態の入出力遷移と、その状態からの遷移追加操作を表示する。
 * @returns 状態選択時の遷移一覧。それ以外は表示しない。
 */
export function StateMachineNodeTransitions() {
  const context = useStateMachineContext();

  if (!context.some) {
    return null;
  }

  const { view } = context.value;

  if (view.inspection?.kind !== "node") {
    return null;
  }

  return (
    <div className="state-machine-screen__node-transitions">
      {view.inspection.canAddTransition && (
        <button type="button" onClick={() => view.selectPart("transition")}>
          この状態から遷移を追加
        </button>
      )}
      <StateMachineTransitionList direction="outgoing" />
      <StateMachineTransitionList direction="incoming" />
    </div>
  );
}

function StateMachineTransitionList({
  direction,
}: Readonly<{ direction: "outgoing" | "incoming" }>) {
  const headingId = useId();
  const context = useStateMachineContext();

  if (!context.some) {
    return null;
  }

  const { view } = context.value;
  const { graph, inspection } = view;

  if (graph === null || inspection?.kind !== "node") {
    return null;
  }

  const heading = direction === "outgoing" ? "出ていく遷移" : "入ってくる遷移";
  const transitions = inspection[direction];

  return (
    <section
      className="state-machine-screen__transition-section"
      aria-labelledby={headingId}
    >
      <h3 id={headingId}>{heading}</h3>
      {transitions.length === 0 && <p>遷移はありません</p>}
      <ul aria-label={heading}>
        {transitions.map((edge) => {
          const names = StateMachineGraph.endpoints(graph, edge);
          const partner =
            direction === "outgoing" ? `→ ${names.to}` : `← ${names.from}`;

          return (
            <li key={edge.id}>
              <button
                type="button"
                onClick={(event) => {
                  view.selectElement({ kind: "edge", id: edge.id });
                  focusGraph(event.currentTarget, true);
                }}
              >
                <span>{edge.event}</span>
                <span className="state-machine-screen__transition-partner">
                  {partner}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
