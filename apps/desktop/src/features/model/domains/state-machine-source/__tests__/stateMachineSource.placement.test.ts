import { expect, test } from "vitest";
import { AnalyzedModel } from "../../analyzed-model";
import { machine, position } from "./stateMachinePlacement.test-support";
import { StateMachinePlacement } from "../../state-machine-placement";
import { StateMachineSource } from "..";
import { Result } from "@domain-modeler/canvas-core";
import { ModelTextHistory } from "../../model-text-history";

const source = `data ID = string
state-machine 注文 =
  initial: 待機
  state: 待機 // 説明
  state: 完了 terminal
  transition: 待機 -> 完了 on 支払い
state-machine 返金 =
  state: 待機`;

test("クリック配置は他マシンを変えず、既存状態の座標と一緒に保存する", () => {
  const before = position(source, "待機");
  const placed = Result.unwrap(StateMachineSource.place(source, machine(source), { x: 500, y: 400 }));
  expect(position(placed, "状態1")).toEqual({ x: 500, y: 400 });
  expect(position(placed, "待機")).toEqual(before);
  expect(placed).toContain("// 説明 @canvas-position(v1,");
  expect(placed).toContain("state-machine 返金 =\n  state: 待機");
  expect(AnalyzedModel.create(placed).diagnostics.map((item) => item.message)).toEqual(AnalyzedModel.create(source).diagnostics.map((item) => item.message));
});

test("移動後の名前・初期終端属性・イベント編集と状態追加で配置が戻らない", () => {
  const moved = Result.unwrap(StateMachineSource.move(source, machine(source), { name: "完了", point: { x: 450, y: 320 } }));
  const renamed = Result.unwrap(StateMachineSource.updateState(moved, machine(moved), { oldName: "完了", name: "配送済み", initial: false, terminal: false }));
  const edge = machine(renamed).machine.transitions[0]!;
  const edited = Result.unwrap(StateMachineSource.updateTransition(renamed, machine(renamed), { range: edge.range, from: "待機", to: "配送済み", event: "発送" }));
  const added = Result.unwrap(StateMachineSource.add(edited, machine(edited), { part: "state", name: "確認中", initial: false, terminal: false }));
  expect(position(added, "配送済み")).toEqual({ x: 450, y: 320 });
  expect(position(added, "待機")).toEqual(position(source, "待機"));
});

test("座標は宣言行に属するため、DSL直接リネーム・行移動・マシン名変更でも復元できる", () => {
  const moved = Result.unwrap(StateMachineSource.move(source, machine(source), { name: "待機", point: { x: 500, y: 300 } }));
  const external = `// 外部編集\n${moved.replace(/待機/g, "保留").replace("state-machine 注文", "state-machine 受注")}`;
  expect(position(external, "保留")).toEqual({ x: 500, y: 300 });
});

test("削除した状態の座標コメントは残らず、Undoで宣言と位置が一緒に復元する", () => {
  const moved = Result.unwrap(StateMachineSource.move(source, machine(source), { name: "待機", point: { x: 500, y: 300 } }));
  const removed = Result.unwrap(StateMachineSource.remove(moved, machine(moved), { kind: "state", name: "待機" }));
  expect(removed).not.toContain("@canvas-position(v1, 500, 300)");
  const history = ModelTextHistory.record(ModelTextHistory.create(moved), removed);
  expect(position(ModelTextHistory.undo(history).current, "待機")).toEqual({ x: 500, y: 300 });
});

test("自動整列は明示操作で保存し、UndoとRedoで配置を往復できる", () => {
  const moved = Result.unwrap(StateMachineSource.move(source, machine(source), { name: "待機", point: { x: 500, y: 300 } }));
  const arranged = Result.unwrap(StateMachineSource.arrange(moved, machine(moved)));
  expect(position(arranged, "待機")).toEqual(position(source, "待機"));
  const history = ModelTextHistory.record(ModelTextHistory.create(moved), arranged);
  expect(ModelTextHistory.undo(history).current).toBe(moved);
  expect(ModelTextHistory.redo(ModelTextHistory.undo(history)).current).toBe(arranged);
});

test.each(["@canvas-position(v2, 100, 200)", "@canvas-position(v1, NaN, 1)", "@canvas-position(v1, , 1)", "@canvas-position(v1, -1000001, 2)", "@canvas-position(v1, 1000001, 2)"])("不正な配置コメント %s は上書きせずエラーにする", (annotation) => {
  const text = `state-machine 注文 =\n  state: 待機 // ${annotation}`;
  expect(StateMachinePlacement.read(text, machine(text)).ok).toBe(false);
  expect(StateMachineSource.move(text, machine(text), { name: "待機", point: { x: 5, y: 5 } }).ok).toBe(false);
  expect(StateMachineSource.arrange(text, machine(text)).ok).toBe(false);
});

test("CRLF・通常コメント・未注釈の旧文書を維持し、2回移動してもコメントを重複しない", () => {
  const crlf = source.replace(/\n/g, "\r\n");
  const first = Result.unwrap(StateMachineSource.move(crlf, machine(crlf), { name: "待機", point: { x: 300, y: 200 } }));
  const second = Result.unwrap(StateMachineSource.move(first, machine(first), { name: "待機", point: { x: 600, y: 400 } }));
  expect(second.replace(/\r\n/g, "")).not.toContain("\n");
  expect(second.match(/@canvas-position/g)).toHaveLength(2);
  expect(second).toContain("state: 待機 // 説明 @canvas-position(v1, 600, 400)\r\n");
});

test("重複状態と未解決の参照ノードは移動を拒否する", () => {
  const duplicate = "state-machine 注文 =\n  state: A\n  state: A";
  expect(StateMachineSource.move(duplicate, machine(duplicate), { name: "A", point: { x: 100, y: 100 } }).ok).toBe(false);
  const unresolved = "state-machine 注文 =\n  state: A\n  transition: A -> B on 終了";
  expect(StateMachineSource.move(unresolved, machine(unresolved), { name: "B", point: { x: 100, y: 100 } }).ok).toBe(false);
});

test("空マシンに配置した最初の状態は初期状態になり、名前は未解決参照とも衝突しない", () => {
  const empty = "state-machine 注文 =\n";
  const first = Result.unwrap(StateMachineSource.place(empty, machine(empty), { x: 220, y: 150 }));
  expect(first).toContain("initial: 状態1");
  const reference = `${first}\n  transition: 状態1 -> 状態2 on 次`;
  const next = Result.unwrap(StateMachineSource.place(reference, machine(reference), { x: 500, y: 250 }));
  expect(next).toContain("state: 状態3");
});


test("負の座標へ移動した状態も保存・再読込・フィット範囲で欠落しない", () => {
  const moved = Result.unwrap(StateMachineSource.move(source, machine(source), { name: "待機", point: { x: -300, y: -200 } }));
  const layout = Result.unwrap(StateMachinePlacement.layout(moved, machine(moved)));
  expect(position(moved, "待機")).toEqual({ x: -300, y: -200 });
  expect(layout.left).toBeLessThan(-300);
  expect(layout.top).toBeLessThan(-200);
  expect(layout.left + layout.width).toBeGreaterThan(position(moved, "完了")!.x);
});
