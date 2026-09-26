import type { StateMachinePart } from "../../domains/state-machine-source";

export const PART_LABELS: Readonly<Record<StateMachinePart, string>> = {
  state: "状態",
  initial: "初期",
  terminal: "終端",
  transition: "遷移",
};
