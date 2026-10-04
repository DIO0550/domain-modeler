/** ドラッグ後のclick/dblclickと、新しく始めた通常クリックを区別する。 */
export type StateMachineActivation = "ready" | "blocked" | "awaiting-click";

export const StateMachineActivation = {
  block(): StateMachineActivation {
    return "blocked";
  },
  finishClick(activation: StateMachineActivation): StateMachineActivation {
    if (activation === "ready") {
      return activation;
    }
    return "awaiting-click";
  },
  click(activation: StateMachineActivation, detail: number): StateMachineActivation {
    if (activation === "awaiting-click" && detail <= 1) {
      return "ready";
    }
    if (activation !== "ready") {
      return "blocked";
    }
    return activation;
  },
  canEdit(activation: StateMachineActivation): boolean {
    return activation === "ready";
  },
} as const;
