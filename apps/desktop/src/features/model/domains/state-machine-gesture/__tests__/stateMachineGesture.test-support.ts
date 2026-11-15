import type { StateMachineGesture } from "..";

export const setupStateGesture = (
  overrides: Partial<StateMachineGesture> = {},
): StateMachineGesture => ({
  source: "state-machine 注文 =\n  state: 待機",
  pointerId: 1,
  start: { x: 100, y: 200 },
  current: { x: 100, y: 200 },
  origin: { x: -50, y: 80 },
  scale: { x: 2, y: 0.5 },
  moved: false,
  target: { kind: "node", name: "待機" },
  ...overrides,
});
