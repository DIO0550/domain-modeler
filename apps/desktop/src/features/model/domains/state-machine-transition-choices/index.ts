import type { StateMachineDecl } from "@domain-modeler/model-core";

/** 遷移追加時に選択できる、宣言済みの遷移元と遷移先。 */
export type StateMachineTransitionChoices = Readonly<{
  from: readonly string[];
  to: readonly string[];
}>;

export const StateMachineTransitionChoices = {
  create(machine: StateMachineDecl): StateMachineTransitionChoices {
    const terminalNames = new Set(
      machine.states
        .filter((state) => state.terminal)
        .map((state) => state.name),
    );
    const to = [...new Set(machine.states.map((state) => state.name))];

    return { from: to.filter((name) => !terminalNames.has(name)), to };
  },

  /** 候補にない選択は先頭へ戻す。候補がなければ空欄にする。 */
  selection(
    choices: StateMachineTransitionChoices,
    selected: Readonly<{ from: string; to: string }>,
  ): Readonly<{ from: string; to: string }> {
    return {
      from: choices.from.includes(selected.from)
        ? selected.from
        : (choices.from[0] ?? ""),
      to: choices.to.includes(selected.to)
        ? selected.to
        : (choices.to[0] ?? ""),
    };
  },
} as const;
