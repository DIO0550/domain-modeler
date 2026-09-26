import { Identifier, Result, type Result as ResultValue, type StateMachineResolution } from "@domain-modeler/model-core";

export type StateMachinePart = "state" | "initial" | "terminal" | "transition";
export type StateMachineSourceInput = Readonly<{
  part: StateMachinePart;
  name: string;
  from: string;
  to: string;
  event: string;
}>;

/** Graph actions produce one update to the canonical .dmodel source. */
export const StateMachineSource = {
  create(source: string, name: string): ResultValue<string, string> {
    if (!Identifier.isAcceptable(name)) {
      return Result.err("有効なマシン名を入力してください");
    }
    if (source.length === 0) {
      return Result.ok(`state-machine ${name} =\n`);
    }
    const separator = source.endsWith("\n") ? "\n" : "\n\n";
    return Result.ok(`${source}${separator}state-machine ${name} =\n`);
  },
  add(source: string, resolution: StateMachineResolution, input: StateMachineSourceInput): ResultValue<string, string> {
    const machine = resolution.machine;
    let line: string;
    if (input.part === "transition") {
      if (![input.from, input.to, input.event].every(Identifier.isAcceptable)) {
        return Result.err("遷移元・遷移先・イベント名を入力してください");
      }
      const names = new Set(machine.states.map((state) => state.name));
      if (!names.has(input.from) || !names.has(input.to)) {
        return Result.err("マシン内の状態を遷移元と遷移先に指定してください");
      }
      if (machine.states.some((state) => state.name === input.from && state.terminal)) {
        return Result.err("終端状態からは遷移できません");
      }
      if (machine.transitions.some((edge) => edge.from === input.from && edge.to === input.to && edge.event === input.event)) {
        return Result.err("同じ遷移が既にあります");
      }
      line = `  transition: ${input.from} -> ${input.to} on ${input.event}`;
    } else if (input.part === "initial") {
      if (!machine.states.some((state) => state.name === input.name)) {
        return Result.err("既存の状態名を入力してください");
      }
      if (machine.initials.length > 0) {
        return Result.err("初期状態は既に設定されています。変更はモデル定義で行ってください");
      }
      line = `  initial: ${input.name}`;
    } else {
      if (!Identifier.isAcceptable(input.name)) {
        return Result.err("有効な状態名を入力してください");
      }
      if (machine.states.some((state) => state.name === input.name)) {
        return Result.err("同じ名前の状態が既にあります");
      }
      line = `  state: ${input.name}${input.part === "terminal" ? " terminal" : ""}`;
    }
    const lines = source.split("\n");
    // A declaration ends before the next unindented declaration. Insert after its last parsed line.
    const lastLine = Math.min(machine.range.endLine, lines.length);
    lines.splice(lastLine, 0, line);
    return Result.ok(lines.join("\n"));
  },
} as const;
