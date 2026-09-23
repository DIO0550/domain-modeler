import { expect, test } from "vitest";
import { SourceRange } from "../../source-range";
import { StateDecl, StateMachineDecl, TransitionDecl } from "..";

test("状態は初期・終端フラグと名前のソース範囲を保持する", () => {
  const nameRange = SourceRange.onLine(2, 10, 13);
  const range = SourceRange.onLine(2, 3, 20);

  expect(
    StateDecl.create({
      name: "完了",
      nameRange,
      initial: false,
      terminal: true,
      range,
    }),
  ).toEqual({
    kind: "state",
    name: "完了",
    nameRange,
    initial: false,
    terminal: true,
    range,
  });
});

test("遷移は元・先・イベント名と各ソース範囲を保持する", () => {
  const fromRange = SourceRange.onLine(4, 15, 18);
  const toRange = SourceRange.onLine(5, 5, 7);
  const eventRange = SourceRange.onLine(5, 11, 15);
  const range = SourceRange.span(fromRange, eventRange);

  expect(
    TransitionDecl.create({
      from: "未検証",
      fromRange,
      to: "完了",
      toRange,
      event: "確定する",
      eventRange,
      range,
    }),
  ).toEqual({
    kind: "transition",
    from: "未検証",
    fromRange,
    to: "完了",
    toRange,
    event: "確定する",
    eventRange,
    range,
  });
});

test("state-machine 宣言は状態・遷移を出現順とソース範囲付きで保持する", () => {
  const initial = StateDecl.create({
    name: "未検証",
    nameRange: SourceRange.onLine(2, 12, 16),
    initial: true,
    terminal: false,
    range: SourceRange.onLine(2, 3, 16),
  });
  const terminal = StateDecl.create({
    name: "完了",
    nameRange: SourceRange.onLine(3, 10, 12),
    initial: false,
    terminal: true,
    range: SourceRange.onLine(3, 3, 17),
  });
  const transition = TransitionDecl.create({
    from: "未検証",
    fromRange: SourceRange.onLine(4, 15, 18),
    to: "完了",
    toRange: SourceRange.onLine(5, 5, 7),
    event: "確定する",
    eventRange: SourceRange.onLine(5, 11, 15),
    range: SourceRange.onLine(4, 3, 15),
  });
  const decl = StateMachineDecl.create({
    name: "注文",
    nameRange: SourceRange.onLine(1, 15, 17),
    initials: [],
    states: [initial, terminal],
    transitions: [transition],
    range: SourceRange.span(
      SourceRange.onLine(1, 1, 17),
      SourceRange.onLine(5, 15, 15),
    ),
  });

  expect(decl).toEqual({
    kind: "state-machine",
    name: "注文",
    nameRange: SourceRange.onLine(1, 15, 17),
    initials: [],
    states: [initial, terminal],
    transitions: [transition],
    range: SourceRange.span(
      SourceRange.onLine(1, 1, 17),
      SourceRange.onLine(5, 15, 15),
    ),
  });
  expect(StateMachineDecl.hasInitialState(decl)).toBe(true);
  expect(StateMachineDecl.hasTerminalState(decl)).toBe(true);
});
