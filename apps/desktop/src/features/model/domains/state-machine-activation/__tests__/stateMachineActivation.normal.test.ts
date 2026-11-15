import { expect, test } from "vitest";
import { StateMachineActivation } from "..";

test("ドラッグ直後のダブルクリックでは名前編集を開始しない", () => {
  const blocked = StateMachineActivation.block();
  const clicked = StateMachineActivation.click(blocked, 2);

  expect(StateMachineActivation.canEdit(clicked)).toBe(false);
});

test("ドラッグ直後に届く通常クリックでも名前編集を開始しない", () => {
  const blocked = StateMachineActivation.block();
  const clicked = StateMachineActivation.click(blocked, 1);

  expect(StateMachineActivation.canEdit(clicked)).toBe(false);
});

test("取消操作が完了しても同じクリック列のダブルクリックは編集を開始しない", () => {
  const finished = StateMachineActivation.finishClick(
    StateMachineActivation.block(),
  );
  const clicked = StateMachineActivation.click(finished, 2);

  expect(StateMachineActivation.canEdit(clicked)).toBe(false);
});

test("操作完了後の新しいダブルクリックでは名前編集を開始できる", () => {
  const finished = StateMachineActivation.finishClick(
    StateMachineActivation.block(),
  );
  const firstClick = StateMachineActivation.click(finished, 1);
  const secondClick = StateMachineActivation.click(
    StateMachineActivation.finishClick(firstClick),
    2,
  );

  expect(StateMachineActivation.canEdit(secondClick)).toBe(true);
});
