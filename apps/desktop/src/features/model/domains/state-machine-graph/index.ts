import {
  SourceRange,
  type Diagnostic,
  type SourceRange as SourceRangeValue,
  type StateMachineResolution,
  type TransitionDecl,
} from "@domain-modeler/model-core";

/** 描画方法に依存しない、1つの state-machine のレイアウト入力。 */
export type StateMachineGraph = Readonly<{
  name: string;
  range: SourceRangeValue;
  nameRange: SourceRangeValue;
  status: GraphDiagnosticState;
  diagnostics: readonly Diagnostic[];
  nodes: readonly Readonly<{
    id: string;
    name: string;
    appearance: "normal" | "initial" | "terminal" | "initial-terminal" | "unresolved";
    range: SourceRangeValue;
    status: GraphDiagnosticState;
    diagnostics: readonly Diagnostic[];
  }>[];
  edges: readonly Readonly<{
    id: string;
    from: string;
    to: string;
    event: string;
    range: SourceRangeValue;
    eventRange: SourceRangeValue;
    status: GraphDiagnosticState;
    diagnostics: readonly Diagnostic[];
  }>[];
}>;

type GraphDiagnosticState = "valid" | "warning" | "error";

const statusOf = (diagnostics: readonly Diagnostic[]): GraphDiagnosticState => {
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return "error";
  }
  if (diagnostics.some((diagnostic) => diagnostic.severity === "warning")) {
    return "warning";
  }
  return "valid";
};

const compareText = (left: string, right: string): number =>
  left < right ? -1 : Number(left > right);

const compareRange = (left: SourceRangeValue, right: SourceRangeValue): number =>
  left.startLine - right.startLine ||
  left.startColumn - right.startColumn ||
  left.endLine - right.endLine ||
  left.endColumn - right.endColumn;

const within = (inner: SourceRangeValue, outer: SourceRangeValue): boolean =>
  comparePosition(inner.startLine, inner.startColumn, outer.startLine, outer.startColumn) >= 0 &&
  comparePosition(inner.endLine, inner.endColumn, outer.endLine, outer.endColumn) <= 0;

const comparePosition = (leftLine: number, leftColumn: number, rightLine: number, rightColumn: number): number =>
  leftLine - rightLine || leftColumn - rightColumn;

const nodeId = (name: string): string => `state:${encodeURIComponent(name)}`;

const transitionId = (transition: TransitionDecl): string =>
  `transition:${encodeURIComponent(transition.from)}/${encodeURIComponent(transition.to)}/${encodeURIComponent(transition.event)}`;

const compareTransition = (left: TransitionDecl, right: TransitionDecl): number =>
  compareText(left.from, right.from) ||
  compareText(left.to, right.to) ||
  compareText(left.event, right.event) ||
  compareRange(left.range, right.range);

const sortedDiagnostics = (diagnostics: readonly Diagnostic[]): readonly Diagnostic[] =>
  [...diagnostics].sort((left, right) =>
    compareRange(left.range, right.range) || compareText(left.message, right.message),
  );

const appearanceOf = (initial: boolean, terminal: boolean): StateMachineGraph["nodes"][number]["appearance"] => {
  if (initial && terminal) {
    return "initial-terminal";
  }
  if (initial) {
    return "initial";
  }
  if (terminal) {
    return "terminal";
  }
  return "normal";
};

/** state-machine の AST・参照解決結果を、安定順のノードと有向辺へ投影する。 */
export const StateMachineGraph = {
  /**
   * 解析結果から描画モデルを作る。構文診断も含む全文の診断を渡す。
   * @param resolution 対象マシンの参照解決結果。
   * @param diagnostics 文書全体の構文・意味診断。
   * @returns 選択位置と診断を保持したレイアウト入力。
   */
  create(resolution: StateMachineResolution, diagnostics: readonly Diagnostic[]): StateMachineGraph {
    const { machine, definitions, references } = resolution;
    const machineDiagnostics = sortedDiagnostics(
      diagnostics.filter((diagnostic) => within(diagnostic.range, machine.range)),
    );
    const names = Object.keys(references).sort(compareText);
    const nodes = names.map((name) => {
      const definition = Object.prototype.hasOwnProperty.call(definitions, name) ? definitions[name] : undefined;
      const occurrences = references[name] ?? [];
      if (definition === undefined) {
        const range = [...occurrences].sort(compareRange)[0] ?? machine.nameRange;
        const nodeDiagnostics = machineDiagnostics.filter((diagnostic) =>
          occurrences.some((occurrence) => SourceRange.equals(diagnostic.range, occurrence)),
        );
        return {
          id: nodeId(name),
          name,
          appearance: "unresolved" as const,
          range,
          status: statusOf(nodeDiagnostics),
          diagnostics: nodeDiagnostics,
        };
      }
      const declarationRanges = machine.states
        .filter((state) => state.name === name)
        .map((state) => state.nameRange);
      const initialRanges = machine.initials
        .filter((initial) => initial.name === name)
        .map((initial) => initial.nameRange);
      const relevantRanges = [...declarationRanges, ...initialRanges];
      const nodeDiagnostics = machineDiagnostics.filter((diagnostic) =>
        relevantRanges.some((range) => SourceRange.equals(diagnostic.range, range)),
      );
      return {
        id: nodeId(name),
        name,
        appearance: appearanceOf(definition.initial, definition.terminal),
        range: definition.nameRange,
        status: statusOf(nodeDiagnostics),
        diagnostics: nodeDiagnostics,
      };
    });
    const transitions = [...machine.transitions].sort(compareTransition);
    const edges = transitions.map((transition, index) => {
      const previousDuplicates = transitions.slice(0, index).filter(
        (previous) => transitionId(previous) === transitionId(transition),
      ).length;
      const edgeDiagnostics = machineDiagnostics.filter((diagnostic) =>
        within(diagnostic.range, transition.range),
      );
      return {
        id: `${transitionId(transition)}:${previousDuplicates}`,
        from: nodeId(transition.from),
        to: nodeId(transition.to),
        event: transition.event,
        range: transition.range,
        eventRange: transition.eventRange,
        status: statusOf(edgeDiagnostics),
        diagnostics: edgeDiagnostics,
      };
    });
    return {
      name: machine.name,
      range: machine.range,
      nameRange: machine.nameRange,
      status: statusOf(machineDiagnostics),
      diagnostics: machineDiagnostics,
      nodes,
      edges,
    };
  },
} as const;
