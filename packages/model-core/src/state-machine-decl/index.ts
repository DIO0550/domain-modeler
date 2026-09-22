import type { SourceRange } from "../source-range";

/** state-machine 内の状態。 */
export type StateDecl = Readonly<{
  kind: "state";
  name: string;
  nameRange: SourceRange;
  initial: boolean;
  terminal: boolean;
  range: SourceRange;
}>;

/** StateDecl を生成するときの引数。 */
export type StateDeclCreateParams = Readonly<{
  name: string;
  nameRange: SourceRange;
  initial: boolean;
  terminal: boolean;
  range: SourceRange;
}>;

/** state-machine 内の有向遷移。 */
export type TransitionDecl = Readonly<{
  kind: "transition";
  from: string;
  fromRange: SourceRange;
  to: string;
  toRange: SourceRange;
  event: string;
  eventRange: SourceRange;
  range: SourceRange;
}>;

/** TransitionDecl を生成するときの引数。 */
export type TransitionDeclCreateParams = Readonly<{
  from: string;
  fromRange: SourceRange;
  to: string;
  toRange: SourceRange;
  event: string;
  eventRange: SourceRange;
  range: SourceRange;
}>;

/** state-machine 宣言。 */
export type StateMachineDecl = Readonly<{
  kind: "state-machine";
  name: string;
  nameRange: SourceRange;
  states: readonly StateDecl[];
  transitions: readonly TransitionDecl[];
  range: SourceRange;
}>;

/** StateMachineDecl を生成するときの引数。 */
export type StateMachineDeclCreateParams = Readonly<{
  name: string;
  nameRange: SourceRange;
  states: readonly StateDecl[];
  transitions: readonly TransitionDecl[];
  range: SourceRange;
}>;

/** 状態 AST を生成する関数群。 */
export const StateDecl = {
  /**
   * 状態名・フラグ・位置から状態を生成する。
   * @param params 生成パラメータ。
   * @returns state-machine の状態。
   */
  create: (params: StateDeclCreateParams): StateDecl => ({
    kind: "state",
    name: params.name,
    nameRange: params.nameRange,
    initial: params.initial,
    terminal: params.terminal,
    range: params.range,
  }),
} as const;

/** 遷移 AST を生成する関数群。 */
export const TransitionDecl = {
  /**
   * 遷移元・遷移先・イベント名・位置から遷移を生成する。
   * @param params 生成パラメータ。
   * @returns state-machine の遷移。
   */
  create: (params: TransitionDeclCreateParams): TransitionDecl => ({
    kind: "transition",
    from: params.from,
    fromRange: params.fromRange,
    to: params.to,
    toRange: params.toRange,
    event: params.event,
    eventRange: params.eventRange,
    range: params.range,
  }),
} as const;

/** state-machine 宣言を生成・判定する関数群。 */
export const StateMachineDecl = {
  /**
   * 名前・状態・遷移・位置から state-machine 宣言を生成する。
   * @param params 生成パラメータ。
   * @returns state-machine 宣言。
   */
  create: (params: StateMachineDeclCreateParams): StateMachineDecl => ({
    kind: "state-machine",
    name: params.name,
    nameRange: params.nameRange,
    states: params.states,
    transitions: params.transitions,
    range: params.range,
  }),
  /**
   * 初期状態を持つか判定する。
   * @param decl state-machine 宣言。
   * @returns 初期状態が1つ以上あれば `true`。
   */
  hasInitialState: (decl: StateMachineDecl): boolean =>
    decl.states.some((state) => state.initial),
  /**
   * 終端状態を持つか判定する。
   * @param decl state-machine 宣言。
   * @returns 終端状態が1つ以上あれば `true`。
   */
  hasTerminalState: (decl: StateMachineDecl): boolean =>
    decl.states.some((state) => state.terminal),
} as const;
