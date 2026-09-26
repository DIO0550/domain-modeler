import { expect, test } from "vitest";
import { StateMachineGraph } from "..";
import { graphOf } from "./stateMachineGraph.test-support";

test("状態と遷移をノード・有向辺に投影し、初期と終端を区別する", () => {
  const graph = graphOf(`state-machine 注文 =
  transition: 待機 -> 完了 on 確定
  transition: 待機 -> 待機 on 再試行
  initial: 待機
  state: 完了 terminal
  state: 待機`);

  expect(graph.nodes.map(({ name, appearance }) => ({ name, appearance }))).toEqual([
    { name: "完了", appearance: "terminal" },
    { name: "待機", appearance: "initial" },
  ]);
  expect(graph.edges.map(({ from, to, event }) => ({ from, to, event }))).toEqual([
    { from: "state:%E5%BE%85%E6%A9%9F", to: "state:%E5%AE%8C%E4%BA%86", event: "確定" },
    { from: "state:%E5%BE%85%E6%A9%9F", to: "state:%E5%BE%85%E6%A9%9F", event: "再試行" },
  ]);
  expect(graph.diagnostics).toEqual([]);
  expect(graph.status).toBe("valid");
});

test("宣言と遷移の行を入れ替えてもノード・辺の ID と順序が変わらない", () => {
  const first = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
  transition: 待機 -> 完了 on 再試行`);
  const second = graphOf(`state-machine 注文 =
  transition: 待機 -> 完了 on 再試行
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
  state: 待機
  initial: 待機`);

  expect(second.nodes.map((node) => node.id)).toEqual(first.nodes.map((node) => node.id));
  expect(second.edges.map((edge) => edge.id)).toEqual(first.edges.map((edge) => edge.id));
});

test("選択したマシン・状態・辺から DSL の宣言範囲とイベント位置へ戻れる", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`);

  expect(graph.nameRange).toMatchObject({ startLine: 1 });
  expect(graph.nodes.find((node) => node.name === "待機")?.range).toMatchObject({ startLine: 3 });
  expect(graph.edges[0]?.range).toMatchObject({ startLine: 5 });
  expect(graph.edges[0]?.eventRange).toMatchObject({ startLine: 5 });
});

test("初期かつ終端の状態を一つの視覚状態で表現する", () => {
  const graph = graphOf(`state-machine 返金 =
  initial: 申請
  state: 申請 terminal`);

  expect(graph.nodes[0]?.appearance).toBe("initial-terminal");
});

test("選択対象を一つの検査結果へ解決し、DSL更新で消えた対象は全体表示へ戻す", () => {
  const graph = graphOf(`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定`);
  const node = graph.nodes.find((item) => item.name === "待機");
  const edge = graph.edges[0];
  expect(node).toBeDefined();
  expect(edge).toBeDefined();
  if (node === undefined || edge === undefined) { return; }

  expect(StateMachineGraph.inspect(graph, { kind: "node", id: node.id })).toMatchObject({
    kind: "node", node: { name: "待機", appearance: "initial" },
  });
  expect(StateMachineGraph.inspect(graph, { kind: "edge", id: edge.id })).toMatchObject({
    kind: "edge", edge: { event: "確定" }, fromName: "待機", toName: "完了",
  });
  expect(StateMachineGraph.inspect(graph, { kind: "edge", id: "deleted" })).toMatchObject({
    kind: "machine", name: "注文",
  });
});
