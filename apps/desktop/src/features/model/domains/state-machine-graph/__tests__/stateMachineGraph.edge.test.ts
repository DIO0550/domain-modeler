import { expect, test } from "vitest";
import { graphOf } from "./stateMachineGraph.test-support";

test("未定義の遷移先は参照位置付きの未解決ノードになり、辺の端点は必ず存在する", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  transition: 待機 -> 不明 on 確定`);
  const missing = graph.nodes.find((node) => node.name === "不明");

  expect(missing).toMatchObject({ appearance: "unresolved", range: { startLine: 4 } });
  expect(missing?.status).toBe("error");
  expect(missing?.diagnostics.map((diagnostic) => diagnostic.message)).toEqual([
    "状態「不明」は未定義です",
  ]);
  expect(graph.edges[0]?.to).toBe(missing?.id);
  expect(graph.edges.flatMap((edge) => [edge.from, edge.to]).every(
    (id) => graph.nodes.some((node) => node.id === id),
  )).toBe(true);
});

test("壊れた遷移行は辺にせず、構文診断を保持して後続の辺を表示する", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  transition: 待機 ->
  transition: 待機 -> 待機 on 再試行`);

  expect(graph.edges).toHaveLength(1);
  expect(graph.edges[0]?.event).toBe("再試行");
  expect(graph.diagnostics.map((diagnostic) => diagnostic.message)).toContain("遷移先の識別子が必要です");
  expect(graph.status).toBe("error");
});

test("重複状態と重複遷移は一意の ID を持ち、該当する診断を保持する", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 待機
  transition: 待機 -> 待機 on 再試行
  transition: 待機 -> 待機 on 再試行`);

  expect(graph.nodes).toHaveLength(1);
  expect(graph.nodes[0]?.diagnostics.map((diagnostic) => diagnostic.message)).toContain("状態「待機」は既に宣言されています");
  expect(new Set(graph.edges.map((edge) => edge.id)).size).toBe(2);
  expect(graph.edges[1]?.diagnostics.map((diagnostic) => diagnostic.message)).toContain("同じ遷移が既に宣言されています");
  expect(graph.edges[1]?.status).toBe("error");
});

test("別マシンの構文診断を取り込まない", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
state-machine 返金 =
  initial: 申請
  state: 申請
  transition: 申請 ->`);

  expect(graph.diagnostics).toEqual([]);
});
