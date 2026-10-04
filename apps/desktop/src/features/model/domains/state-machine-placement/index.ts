import { Result, type Result as ResultValue, type StateMachineResolution } from "@domain-modeler/model-core";
import { StateMachineGraph } from "../state-machine-graph";
import { StateMachineLayout } from "../state-machine-layout";
import { StateMachinePosition } from "../state-machine-position";

/** 同じマシン内の、実在する状態宣言に結び付いた座標。 */
export type StateMachinePlacement = Readonly<Record<string, StateMachinePosition>>;

export const StateMachinePlacement = {
  isMovable(resolution: StateMachineResolution, name: string): boolean {
    return resolution.machine.states.filter((state) => state.name === name).length === 1;
  },
  read(source: string, resolution: StateMachineResolution): ResultValue<StateMachinePlacement, string> {
    const lines = source.split("\n");
    const entries: [string, StateMachinePosition][] = [];
    for (const state of resolution.machine.states) {
      const point = StateMachinePosition.read(lines[state.range.startLine - 1] ?? "");
      if (Result.isErr(point)) {
        return Result.err(`${state.name}: ${point.error}`);
      }
      if (point.value.some) {
        entries.push([StateMachineGraph.stateSelection(state.name).id, point.value.value]);
      }
    }
    return Result.ok(Object.fromEntries(entries));
  },
  layout(source: string, resolution: StateMachineResolution): ResultValue<StateMachineLayout, string> {
    const positions = StateMachinePlacement.read(source, resolution);
    if (Result.isErr(positions)) {
      return positions;
    }
    return Result.ok(StateMachineLayout.restore(StateMachineGraph.create(resolution, []), positions.value));
  },
  /** 宣言の行番号で更新するため、同名の別マシンと干渉しない。 */
  write(source: string, resolution: StateMachineResolution, positions: StateMachinePlacement): ResultValue<string, string> {
    const states = resolution.machine.states;
    if (new Set(states.map((state) => state.name)).size !== states.length) {
      return Result.err("状態名の重複をモデル定義で修正してください");
    }
    const lines = source.split("\n");
    const changes: [number, string][] = [];
    for (const state of states) {
      const id = StateMachineGraph.stateSelection(state.name).id;
      const point = positions[id];
      if (point === undefined) {
        continue;
      }
      const line = StateMachinePosition.write(lines[state.range.startLine - 1] ?? "", point);
      if (Result.isErr(line)) {
        return line;
      }
      changes.push([state.range.startLine - 1, line.value]);
    }
    const replacements = new Map(changes);
    return Result.ok(lines.map((line, index) => replacements.get(index) ?? line).join("\n"));
  },
  nextName(resolution: StateMachineResolution): string {
    const names = new Set(Object.keys(resolution.references));
    let index = 1;
    while (names.has(`状態${index}`)) {
      index += 1;
    }
    return `状態${index}`;
  },
} as const;
