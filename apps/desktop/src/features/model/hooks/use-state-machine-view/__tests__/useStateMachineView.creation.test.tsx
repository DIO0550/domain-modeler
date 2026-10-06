import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { StateMachineGraph } from "../../../domains/state-machine-graph";
import { createStateMachineViewRenderer } from "./useStateMachineView.test-support";

const views = createStateMachineViewRenderer();

afterEach(() => views.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
state-machine 返金 =
  initial: 申請
  state: 申請`;

test("新しいマシンの作成を始めても表示中のマシンと倍率・表示位置を保持する", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.selectMachine(1);
    view.latest.current!.panBy({ x: 40, y: -25 });
    view.latest.current!.zoomBy(2);
  });

  const graph = view.latest.current!.graph;
  const layout = view.latest.current!.layout;
  const viewport = view.latest.current!.viewport;

  act(() => view.latest.current!.startMachineCreation());

  expect(view.latest.current!.target).toEqual({ kind: "machine" });
  expect(view.latest.current!.selectedMachineIndex).toBe(1);
  expect(view.latest.current!.graph).toEqual(graph);
  expect(view.latest.current!.graph?.name).toBe("返金");
  expect(view.latest.current!.layout).toEqual(layout);
  expect(view.latest.current!.viewport).toEqual(viewport);
  expect(view.latest.current!.zoom).toBe(2);
});

test.each([
  {
    kind: "node",
    selection: StateMachineGraph.stateSelection("待機"),
  },
  {
    kind: "edge",
    selection: StateMachineGraph.transitionSelection({
      from: "待機",
      to: "完了",
      event: "確定",
    }),
  },
])("$kindの選択中にマシン作成を始めると要素の選択と詳細表示を解除する", ({
  kind,
  selection,
}) => {
  const view = views.render(source);

  act(() => view.latest.current!.selectElement(selection));

  expect(view.latest.current!.inspection?.kind).toBe(kind);

  act(() => view.latest.current!.startMachineCreation());

  expect(view.latest.current!.target).toEqual({ kind: "machine" });
  expect(view.latest.current!.inspection).toMatchObject({
    kind: "machine",
    name: "注文",
  });
});

test("パーツの追加中にマシン作成を始めると遷移元を含むパーツ選択を解除する", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.selectElement(
      StateMachineGraph.stateSelection("待機"),
    );
  });
  act(() => view.latest.current!.selectPart("transition"));

  expect(view.latest.current!.target).toEqual({
    kind: "part",
    part: "transition",
    initialFrom: { some: true, value: "待機" },
  });

  act(() => view.latest.current!.startMachineCreation());

  expect(view.latest.current!.target).toEqual({ kind: "machine" });
});

test("マシン作成を取り消しても表示中のマシンと倍率・表示位置を保持する", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.selectMachine(1);
    view.latest.current!.panBy({ x: 40, y: -25 });
    view.latest.current!.zoomBy(2);
    view.latest.current!.startMachineCreation();
  });

  const viewport = view.latest.current!.viewport;

  act(() => view.latest.current!.clearSelection());

  expect(view.latest.current!.target).toEqual({ kind: "none" });
  expect(view.latest.current!.selectedMachineIndex).toBe(1);
  expect(view.latest.current!.graph?.name).toBe("返金");
  expect(view.latest.current!.viewport).toEqual(viewport);
});

test("マシン作成中にパレットで遷移を選ぶと以前の状態を遷移元へ引き継がない", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.selectElement(
      StateMachineGraph.stateSelection("待機"),
    );
  });
  act(() => view.latest.current!.startMachineCreation());
  act(() => view.latest.current!.selectPart("transition"));

  expect(view.latest.current!.target).toEqual({
    kind: "part",
    part: "transition",
    initialFrom: { some: false },
  });
});

test("マシン作成中にグラフの状態を選ぶとその状態の詳細表示へ切り替わる", () => {
  const view = views.render(source);
  const selection = StateMachineGraph.stateSelection("待機");

  act(() => view.latest.current!.startMachineCreation());
  act(() => view.latest.current!.selectElement(selection));

  expect(view.latest.current!.target).toEqual({ kind: "element", selection });
  expect(view.latest.current!.inspection).toMatchObject({
    kind: "node",
    node: { name: "待機" },
  });
});

test("マシン作成中に既存マシンへ切り替えると作成を終了し倍率・表示位置を戻す", () => {
  const view = views.render(source);

  act(() => {
    view.latest.current!.panBy({ x: 40, y: -25 });
    view.latest.current!.zoomBy(2);
    view.latest.current!.startMachineCreation();
  });
  act(() => view.latest.current!.selectMachine(1));

  expect(view.latest.current!.target).toEqual({ kind: "none" });
  expect(view.latest.current!.selectedMachineIndex).toBe(1);
  expect(view.latest.current!.graph?.name).toBe("返金");
  expect(view.latest.current!.viewport).toEqual({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
});

test("マシン作成中の文書更新を反映し、追加されたマシンへ切り替えられる", () => {
  const view = views.render(source);

  act(() => view.latest.current!.startMachineCreation());
  view.replaceSource(`${source}\nstate-machine 配送 =\n  state: 未発送`);

  expect(view.latest.current!.target).toEqual({ kind: "machine" });
  expect(view.latest.current!.analyzed.stateMachines).toHaveLength(3);
  expect(view.latest.current!.selectedMachineIndex).toBe(0);
  expect(view.latest.current!.graph?.name).toBe("注文");

  act(() => view.latest.current!.selectMachine(2));

  expect(view.latest.current!.target).toEqual({ kind: "none" });
  expect(view.latest.current!.selectedMachineIndex).toBe(2);
  expect(view.latest.current!.graph?.name).toBe("配送");
  expect(view.latest.current!.graph?.nodes.map((node) => node.name)).toEqual([
    "未発送",
  ]);
});
