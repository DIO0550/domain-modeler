import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { StateMachineGraph } from "../../state-machine-graph";
import { StateMachineLabelEdit } from "..";
import { setupLabelContext } from "./stateMachineLabelEdit.test-support";

test("状態名の編集は保存済みの位置で現在の名前を初期表示する", () => {
  const context = setupLabelContext();
  const selection = StateMachineGraph.stateSelection("待機");

  expect(StateMachineLabelEdit.create(context, selection)).toEqual(
    Option.some({
      kind: "state",
      selection,
      point: { x: -20, y: 200 },
      value: "待機",
    }),
  );
});

test("遷移名の編集はラベルの位置で現在のイベント名を初期表示する", () => {
  const context = setupLabelContext();
  const selection = StateMachineGraph.transitionSelection({
    from: "待機",
    to: "完了",
    event: "確定",
  });

  expect(StateMachineLabelEdit.create(context, selection)).toEqual(
    Option.some({
      kind: "event",
      selection,
      point: context.layout.edges[0]?.label,
      value: "確定",
      from: "待機",
      to: "完了",
    }),
  );
});

test.each([
  "state-machine 注文 =\n  state: 待機\n  transition: 待機 -> 未定義 on 失敗",
  "state-machine 注文 =\n  state: 未定義\n  state: 未定義",
])("未定義または重複した状態では名前編集を開かない: %s", (source) => {
  const context = setupLabelContext(source);

  expect(
    StateMachineLabelEdit.create(
      context,
      StateMachineGraph.stateSelection("未定義"),
    ),
  ).toEqual(Option.none());
});

test("位置がない状態では名前編集を開かない", () => {
  const context = setupLabelContext();

  expect(
    StateMachineLabelEdit.create(
      { ...context, layout: { ...context.layout, nodes: {} } },
      StateMachineGraph.stateSelection("待機"),
    ),
  ).toEqual(Option.none());
});

test("描画位置がない遷移では名前編集を開かない", () => {
  const context = setupLabelContext();
  const selection = StateMachineGraph.transitionSelection({
    from: "待機",
    to: "完了",
    event: "確定",
  });

  expect(
    StateMachineLabelEdit.create(
      { ...context, layout: { ...context.layout, edges: [] } },
      selection,
    ),
  ).toEqual(Option.none());
});

test("削除済みの選択では名前編集を開かない", () => {
  const context = setupLabelContext();

  expect(
    StateMachineLabelEdit.create(
      context,
      StateMachineGraph.stateSelection("削除済み"),
    ),
  ).toEqual(Option.none());
});

test("状態の名前を変えた後は新しい名前の状態を選択する", () => {
  const context = setupLabelContext();
  const edit = Option.unwrap(
    StateMachineLabelEdit.create(
      context,
      StateMachineGraph.stateSelection("待機"),
    ),
  );

  expect(StateMachineLabelEdit.renamedSelection(edit, "保留")).toEqual(
    StateMachineGraph.stateSelection("保留"),
  );
});

test("イベント名を変えた後は同じ端点間の新しい名前の遷移を選択する", () => {
  const context = setupLabelContext();
  const selection = StateMachineGraph.transitionSelection({
    from: "待機",
    to: "完了",
    event: "確定",
  });
  const edit = Option.unwrap(StateMachineLabelEdit.create(context, selection));

  expect(StateMachineLabelEdit.renamedSelection(edit, "承認")).toEqual(
    StateMachineGraph.transitionSelection({
      from: "待機",
      to: "完了",
      event: "承認",
    }),
  );
});
