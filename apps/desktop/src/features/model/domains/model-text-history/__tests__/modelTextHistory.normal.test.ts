import { expect, test } from "vitest";
import { ModelTextHistory } from "..";

test("一回の構造化DSL編集を一回のUndoとRedoで行き来できる", () => {
  const before = "state-machine 注文 =\n  state: 待機";
  const after = "state-machine 注文 =\n  initial: 待機\n  state: 待機";
  const changed = ModelTextHistory.record(ModelTextHistory.create(before), after);
  expect(ModelTextHistory.undo(changed).current).toBe(before);
  expect(ModelTextHistory.redo(ModelTextHistory.undo(changed)).current).toBe(after);
});

test("Undo後の新しい編集はRedoを破棄する", () => {
  const history = ModelTextHistory.record(ModelTextHistory.create("a"), "b");
  expect(ModelTextHistory.record(ModelTextHistory.undo(history), "c").future).toEqual([]);
});
