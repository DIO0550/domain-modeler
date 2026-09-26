import {
  SourceRange,
  type Diagnostic,
  type SourceRange as SourceRangeValue,
  type StateMachineResolution,
  type TransitionDecl,
} from "@domain-modeler/model-core";

type GraphDiagnosticState = "valid" | "warning" | "error";

/** 状態宣言または未解決参照の描画情報。 */
type StateMachineGraphNode = Readonly<{
  id: string;
  name: string;
  appearance: "normal" | "initial" | "terminal" | "initial-terminal" | "unresolved";
  range: SourceRangeValue;
  status: GraphDiagnosticState;
  diagnostics: readonly Diagnostic[];
}>;

/** 遷移宣言の描画情報。 */
type StateMachineGraphEdge = Readonly<{
  id: string;
  from: string;
  to: string;
  event: string;
  range: SourceRangeValue;
  eventRange: SourceRangeValue;
  status: GraphDiagnosticState;
  diagnostics: readonly Diagnostic[];
}>;

/** 描画方法に依存しない、1つの state-machine のレイアウト入力。 */
export type StateMachineGraph = Readonly<{
  name: string;
  range: SourceRangeValue;
  nameRange: SourceRangeValue;
  status: GraphDiagnosticState;
  diagnostics: readonly Diagnostic[];
  nodes: readonly StateMachineGraphNode[];
  edges: readonly StateMachineGraphEdge[];
}>;

/** グラフ内で選択された状態または遷移。 */
export type StateMachineGraphSelection = Readonly<{ kind: "node" | "edge"; id: string }>;

/** 選択対象が消えた場合はマシン全体に戻る検査結果。 */
export type StateMachineGraphInspection =
  | Readonly<{ kind: "machine"; name: string; diagnostics: readonly Diagnostic[] }>
  | Readonly<{ kind: "node"; node: StateMachineGraphNode; diagnostics: readonly Diagnostic[] }>
  | Readonly<{
      kind: "edge";
      edge: StateMachineGraphEdge;
      fromName: string;
      toName: string;
      diagnostics: readonly Diagnostic[];
    }>;

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

const sortedDiagnostics = (diagnostics: readonly Diagnostic[]): readonly Diagnostic[] =>
  [...diagnostics].sort((left, right) =>
    compareRange(left.range, right.range) || compareText(left.message, right.message),
  );

const StateMachineGraphNode = {
  id(name: string): string {
    return `state:${encodeURIComponent(name)}`;
  },
  createAll(resolution: StateMachineResolution, diagnostics: readonly Diagnostic[]): readonly StateMachineGraphNode[] {
    return Object.keys(resolution.references).sort(compareText)
      .map((name) => StateMachineGraphNode.create(name, resolution, diagnostics));
  },
  appearance(initial: boolean, terminal: boolean): StateMachineGraphNode["appearance"] {
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
  },
  create(name: string, resolution: StateMachineResolution, diagnostics: readonly Diagnostic[]): StateMachineGraphNode {
    const { machine, definitions, references } = resolution;
    const definition = Object.prototype.hasOwnProperty.call(definitions, name) ? definitions[name] : undefined;
    const occurrences = references[name] ?? [];
    if (definition === undefined) {
      const range = [...occurrences].sort(compareRange)[0] ?? machine.nameRange;
      const nodeDiagnostics = diagnostics.filter((diagnostic) =>
        occurrences.some((occurrence) => SourceRange.equals(diagnostic.range, occurrence)),
      );
      return {
        id: StateMachineGraphNode.id(name),
        name,
        appearance: "unresolved",
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
    const nodeDiagnostics = diagnostics.filter((diagnostic) =>
      relevantRanges.some((range) => SourceRange.equals(diagnostic.range, range)),
    );
    return {
      id: StateMachineGraphNode.id(name),
      name,
      appearance: StateMachineGraphNode.appearance(definition.initial, definition.terminal),
      range: definition.nameRange,
      status: statusOf(nodeDiagnostics),
      diagnostics: nodeDiagnostics,
    };
  },
} as const;

const StateMachineGraphEdge = {
  key(transition: TransitionDecl): string {
    return `transition:${encodeURIComponent(transition.from)}/${encodeURIComponent(transition.to)}/${encodeURIComponent(transition.event)}`;
  },
  createAll(transitions: readonly TransitionDecl[], diagnostics: readonly Diagnostic[]): readonly StateMachineGraphEdge[] {
    const sorted = [...transitions].sort(StateMachineGraphEdge.compare);
    return sorted.map((transition, index) => {
      const previousDuplicates = sorted.slice(0, index).filter(
        (previous) => StateMachineGraphEdge.key(previous) === StateMachineGraphEdge.key(transition),
      ).length;
      return StateMachineGraphEdge.create(transition, previousDuplicates, diagnostics);
    });
  },
  compare(left: TransitionDecl, right: TransitionDecl): number {
    return compareText(left.from, right.from) ||
      compareText(left.to, right.to) ||
      compareText(left.event, right.event) ||
      compareRange(left.range, right.range);
  },
  create(transition: TransitionDecl, duplicateIndex: number, diagnostics: readonly Diagnostic[]): StateMachineGraphEdge {
    const edgeDiagnostics = diagnostics.filter((diagnostic) => within(diagnostic.range, transition.range));
    return {
      id: `${StateMachineGraphEdge.key(transition)}:${duplicateIndex}`,
      from: StateMachineGraphNode.id(transition.from),
      to: StateMachineGraphNode.id(transition.to),
      event: transition.event,
      range: transition.range,
      eventRange: transition.eventRange,
      status: statusOf(edgeDiagnostics),
      diagnostics: edgeDiagnostics,
    };
  },
} as const;

/** state-machine の AST・参照解決結果を、安定順のノードと有向辺へ投影する。 */
export const StateMachineGraph = {
  /**
   * 解析結果から描画モデルを作る。構文診断も含む全文の診断を渡す。
   * @param resolution 対象マシンの参照解決結果。
   * @param diagnostics 文書全体の構文・意味診断。
   * @returns 選択位置と診断を保持したレイアウト入力。
   */
  create(resolution: StateMachineResolution, diagnostics: readonly Diagnostic[]): StateMachineGraph {
    const { machine } = resolution;
    const machineDiagnostics = sortedDiagnostics(
      diagnostics.filter((diagnostic) => within(diagnostic.range, machine.range)),
    );
    return {
      name: machine.name,
      range: machine.range,
      nameRange: machine.nameRange,
      status: statusOf(machineDiagnostics),
      diagnostics: machineDiagnostics,
      nodes: StateMachineGraphNode.createAll(resolution, machineDiagnostics),
      edges: StateMachineGraphEdge.createAll(machine.transitions, machineDiagnostics),
    };
  },
  /**
   * 遷移端点の表示名を、未解決参照を含むノード一覧から得る。
   * @param graph 描画用グラフ。
   * @param edge 遷移。
   * @returns 遷移元・遷移先の名前。
   */
  endpoints(graph: StateMachineGraph, edge: StateMachineGraphEdge): Readonly<{ from: string; to: string }> {
    return {
      from: graph.nodes.find((node) => node.id === edge.from)?.name ?? "?",
      to: graph.nodes.find((node) => node.id === edge.to)?.name ?? "?",
    };
  },
  /**
   * 選択中の状態・遷移を解決する。対象がなくなった場合はマシン全体を返す。
   * @param graph 描画用グラフ。
   * @param selection 選択中の識別子。未選択なら省略。
   * @returns 対象の名前と診断を含む検査結果。
   */
  inspect(graph: StateMachineGraph, selection?: StateMachineGraphSelection): StateMachineGraphInspection {
    if (selection?.kind === "node") {
      const node = graph.nodes.find((item) => item.id === selection.id);
      if (node !== undefined) {
        return { kind: "node", node, diagnostics: node.diagnostics };
      }
    }
    if (selection?.kind === "edge") {
      const edge = graph.edges.find((item) => item.id === selection.id);
      if (edge !== undefined) {
        const names = StateMachineGraph.endpoints(graph, edge);
        return { kind: "edge", edge, fromName: names.from, toName: names.to, diagnostics: edge.diagnostics };
      }
    }
    return { kind: "machine", name: graph.name, diagnostics: graph.diagnostics };
  },
} as const;
