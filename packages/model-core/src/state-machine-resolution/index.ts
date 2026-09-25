import { DIAGNOSTIC_SEVERITIES, Diagnostic } from "../diagnostic";
import type { SourceRange } from "../source-range";
import type { StateDecl, StateMachineDecl, TransitionDecl } from "../state-machine-decl";

/** 1つのマシン内に閉じた状態名と最初の宣言。 */
export type StateDefinitionTable = Readonly<Record<string, StateDecl>>;

/** 1つのマシン内の状態名と宣言・参照の出現位置。未定義参照も含む。 */
export type StateReferenceTable = Readonly<Record<string, readonly SourceRange[]>>;

/** マシンの状態参照解決結果。machine で同名マシンも区別する。 */
export type StateMachineResolution = Readonly<{
  machine: StateMachineDecl;
  definitions: StateDefinitionTable;
  references: StateReferenceTable;
  diagnostics: readonly Diagnostic[];
}>;

const hasState = (definitions: StateDefinitionTable, name: string): boolean =>
  Object.prototype.hasOwnProperty.call(definitions, name);

const definitionTableOf = (machine: StateMachineDecl): StateDefinitionTable =>
  machine.states.reduce<StateDefinitionTable>(
    (definitions, state) =>
      hasState(definitions, state.name)
        ? definitions
        : { ...definitions, [state.name]: state },
    {},
  );

type StateOccurrence = Readonly<{ name: string; range: SourceRange }>;

const occurrencesOf = (machine: StateMachineDecl): readonly StateOccurrence[] =>
  [
    ...machine.states.map((state) => ({ name: state.name, range: state.nameRange })),
    ...machine.initials.map((initial) => ({ name: initial.name, range: initial.nameRange })),
    ...machine.transitions.flatMap((transition) => [
      { name: transition.from, range: transition.fromRange },
      { name: transition.to, range: transition.toRange },
    ]),
  ].sort(
    (a, b) =>
      a.range.startLine - b.range.startLine ||
      a.range.startColumn - b.range.startColumn,
  );

const referenceTableOf = (machine: StateMachineDecl): StateReferenceTable =>
  occurrencesOf(machine).reduce<StateReferenceTable>(
    (references, occurrence) => ({
      ...references,
      [occurrence.name]: [
        ...(Object.prototype.hasOwnProperty.call(references, occurrence.name)
          ? references[occurrence.name] ?? []
          : []),
        occurrence.range,
      ],
    }),
    {},
  );

const duplicateStateDiagnosticsOf = (machine: StateMachineDecl): readonly Diagnostic[] =>
  machine.states.flatMap((state, index) =>
    machine.states.slice(0, index).some((prior) => prior.name === state.name)
      ? [
          Diagnostic.create(
            DIAGNOSTIC_SEVERITIES.error,
            `状態「${state.name}」は既に宣言されています`,
            state.nameRange,
          ),
        ]
      : [],
  );

const undefinedStateAt = (
  definitions: StateDefinitionTable,
  occurrence: StateOccurrence,
): readonly Diagnostic[] =>
  hasState(definitions, occurrence.name)
    ? []
    : [
        Diagnostic.create(
          DIAGNOSTIC_SEVERITIES.error,
          `状態「${occurrence.name}」は未定義です`,
          occurrence.range,
        ),
      ];

const initialDiagnosticsOf = (
  machine: StateMachineDecl,
  definitions: StateDefinitionTable,
): readonly Diagnostic[] => [
  ...(machine.initials.length === 0
    ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "初期状態が必要です", machine.nameRange)]
    : []),
  ...machine.initials.flatMap((initial, index) => [
    ...(index > 0
      ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "初期状態は1つだけ指定できます", initial.range)]
      : []),
    ...undefinedStateAt(definitions, { name: initial.name, range: initial.nameRange }),
  ]),
];

const sameTransition = (a: TransitionDecl, b: TransitionDecl): boolean =>
  a.from === b.from && a.to === b.to && a.event === b.event;

const transitionDiagnosticsOf = (
  machine: StateMachineDecl,
  definitions: StateDefinitionTable,
): readonly Diagnostic[] =>
  machine.transitions.flatMap((transition, index) => [
    ...undefinedStateAt(definitions, { name: transition.from, range: transition.fromRange }),
    ...undefinedStateAt(definitions, { name: transition.to, range: transition.toRange }),
    ...(definitions[transition.from]?.terminal
      ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, `終端状態「${transition.from}」からは遷移できません`, transition.fromRange)]
      : []),
    ...(transition.event.trim() === ""
      ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "イベント名が必要です", transition.eventRange)]
      : []),
    ...(machine.transitions.slice(0, index).some((prior) => sameTransition(prior, transition))
      ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "同じ遷移が既に宣言されています", transition.range)]
      : []),
  ]);

/** 状態の名前空間と参照位置を構築し、マシン内の意味違反を集める。 */
export const StateMachineResolution = {
  /**
   * マシン内の前方参照を含めて解決する。
   * @param machine 解析済みのマシン宣言。
   * @returns 状態定義、出現位置、意味診断。
   */
  create: (machine: StateMachineDecl): StateMachineResolution => {
    const definitions = definitionTableOf(machine);
    return {
      machine,
      definitions,
      references: referenceTableOf(machine),
      diagnostics: [
        ...(machine.states.length === 0
          ? [Diagnostic.create(DIAGNOSTIC_SEVERITIES.error, "状態が必要です", machine.nameRange)]
          : []),
        ...duplicateStateDiagnosticsOf(machine),
        ...initialDiagnosticsOf(machine, definitions),
        ...transitionDiagnosticsOf(machine, definitions),
      ],
    };
  },
} as const;
