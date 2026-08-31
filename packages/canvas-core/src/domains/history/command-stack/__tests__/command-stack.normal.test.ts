import { expect, test } from "vitest";
import { ChangeTitleCommand } from "../../document-command";
import { CommandStack } from "..";

test("スタックから最後に積んだコマンドを取り出す", () => {
  const first = ChangeTitleCommand.create({ previous: "0", next: "1" });
  const second = ChangeTitleCommand.create({ previous: "1", next: "2" });
  const stack = CommandStack.push(
    CommandStack.push(CommandStack.empty(), first),
    second,
  );

  expect(CommandStack.pop(stack)).toEqual({
    some: true,
    value: { command: second, remaining: [first] },
  });
});

test("空のスタックからコマンドを取り出すと値なしになる", () => {
  expect(CommandStack.pop(CommandStack.empty())).toEqual({ some: false });
});

test("履歴が100件を超えると最も古いコマンドから破棄する", () => {
  const stack = Array.from({ length: 101 }, (_, index) =>
    ChangeTitleCommand.create({
      previous: String(index),
      next: String(index + 1),
    }),
  ).reduce(CommandStack.push, CommandStack.empty());

  expect(stack).toHaveLength(100);
  expect(stack[0]).toEqual(
    ChangeTitleCommand.create({ previous: "1", next: "2" }),
  );
});
