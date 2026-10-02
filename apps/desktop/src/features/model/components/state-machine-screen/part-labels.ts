import type { StateMachinePart } from "../../domains/state-machine-source";

export const PART_LABELS: Readonly<Record<StateMachinePart, string>> = {
  state: "状態",
  transition: "遷移",
};
