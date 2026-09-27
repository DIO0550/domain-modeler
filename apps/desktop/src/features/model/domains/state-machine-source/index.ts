import { Identifier, Result, type Result as ResultValue, type SourceRange, type StateMachineResolution, type TransitionDecl } from "@domain-modeler/model-core";

export type StateMachinePart = "state" | "initial" | "terminal" | "transition";
export type StateMachineSourceInput = Readonly<{
  part: StateMachinePart;
  name: string;
  from: string;
  to: string;
  event: string;
}>;

export type StateMachineStateInput = Readonly<{ name: string; initial: boolean; terminal: boolean }>;
export type StateMachineTransitionInput = Readonly<{ from: string; to: string; event: string }>;
export type StateMachineStateEdit = Readonly<StateMachineStateInput & { oldName: string }>;
export type StateMachineTransitionEdit = Readonly<StateMachineTransitionInput & { range: SourceRange }>;

type SourceReplacement = Readonly<{ start: number; end: number; text: string }>;

const offsetOf = (source: string, line: number, column: number): number | null => {
  const lines = source.split("\n");
  if (line < 1) {
    return null;
  }
  if (line > lines.length) {
    return null;
  }
  return lines.slice(0, line - 1).reduce((offset, item) => offset + item.length + 1, 0) + column - 1;
};

const replacementOf = (source: string, range: SourceRange, text: string): SourceReplacement | null => {
  const start = offsetOf(source, range.startLine, range.startColumn);
  const end = offsetOf(source, range.endLine, range.endColumn);
  if (start === null) {
    return null;
  }
  if (end === null) {
    return null;
  }
  return { start, end, text };
};

const lineReplacement = (source: string, line: number, text: string): SourceReplacement | null => {
  const start = offsetOf(source, line, 1);
  if (start === null) {
    return null;
  }
  const endOfLine = source.indexOf("\n", start);
  return { start, end: endOfLine < 0 ? source.length : endOfLine, text };
};

const removeLine = (source: string, line: number): SourceReplacement | null => {
  const start = offsetOf(source, line, 1);
  if (start === null) {
    return null;
  }
  const endOfLine = source.indexOf("\n", start);
  if (endOfLine >= 0) {
    return { start, end: endOfLine + 1, text: "" };
  }
  return { start, end: source.length, text: "" };
};

const applyReplacements = (source: string, replacements: readonly (SourceReplacement | null)[]): ResultValue<string, string> => {
  if (replacements.some((replacement) => replacement === null)) {
    return Result.err("編集対象の位置を特定できません");
  }
  const ordered = (replacements.filter((replacement) => replacement !== null) as SourceReplacement[])
    .sort((left, right) => right.start - left.start);
  if (ordered.some((replacement, index) => index > 0 && replacement.end > (ordered[index - 1]?.start ?? source.length))) {
    return Result.err("編集対象が重複しています");
  }
  return Result.ok(ordered.reduce((text, replacement) =>
    `${text.slice(0, replacement.start)}${replacement.text}${text.slice(replacement.end)}`, source));
};

const stateLine = (source: string, line: number, terminal: boolean): SourceReplacement | null => {
  const replacement = lineReplacement(source, line, "");
  if (replacement === null) {
    return null;
  }
  const original = source.slice(replacement.start, replacement.end);
  const commentAt = original.indexOf("//");
  const body = commentAt < 0 ? original : original.slice(0, commentAt);
  const comment = commentAt < 0 ? "" : original.slice(commentAt);
  const withoutTerminal = body.replace(/\s+terminal\s*$/, "").trimEnd();
  const spaceBeforeComment = comment ? body.match(/\s+$/)?.[0] ?? " " : "";
  return { ...replacement, text: `${withoutTerminal}${terminal ? " terminal" : ""}${spaceBeforeComment}${comment}${!comment && original.endsWith("\r") ? "\r" : ""}` };
};

const transitionMatches = (transition: TransitionDecl, input: StateMachineTransitionInput): boolean =>
  transition.from === input.from && transition.to === input.to && transition.event === input.event;

/** グラフの明示的な操作を正規の `.dmodel` 全文へ反映する。 */
export const StateMachineSource = {
  /**
   * 文書末尾にマシン宣言を作成する。
   * @param source 現在の `.dmodel` 全文。
   * @param name 新しいマシン名。
   * @returns 更新後の全文、または名前のエラー。
   */
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
  /**
   * 指定したマシンの末尾へパーツを1行追加する。
   * @param source 現在の `.dmodel` 全文。
   * @param resolution 対象マシンの解析結果。
   * @param input パレットで選んだパーツと入力値。
   * @returns 更新後の全文、または入力のエラー。
   */
  add(source: string, resolution: StateMachineResolution, input: StateMachineSourceInput): ResultValue<string, string> {
    const machine = resolution.machine;
    let line: string;
    if (input.part === "transition") {
      if (![input.from, input.to, input.event].every(Identifier.isAcceptable)) {
        return Result.err("遷移元・遷移先・イベント名を入力してください");
      }
      const names = new Set(machine.states.map((state) => state.name));
      if (![input.from, input.to].every((name) => names.has(name))) {
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
    // 次の非インデント宣言より前、対象マシンの最終行の直後に挿入する。
    const lastLine = Math.min(machine.range.endLine, lines.length);
    lines.splice(lastLine, 0, line);
    return Result.ok(lines.join("\n"));
  },
  /** 状態名の全参照と初期・終端属性を1回の文書更新で変更する。 */
  updateState(source: string, resolution: StateMachineResolution, input: StateMachineStateEdit): ResultValue<string, string> {
    const { machine } = resolution;
    const { oldName } = input;
    const states = machine.states.filter((state) => state.name === oldName);
    if (states.length !== 1) {
      return Result.err("編集する状態を一意に特定できません");
    }
    const state = states[0]!;
    if (!Identifier.isAcceptable(input.name)) {
      return Result.err("有効な状態名を入力してください");
    }
    if (input.name !== oldName && machine.states.some((item) => item.name === input.name)) {
      return Result.err("同じ名前の状態が既にあります");
    }
    if (input.terminal && !state.terminal && machine.transitions.some((edge) => edge.from === oldName)) {
      return Result.err("遷移元になっている状態を終端にできません");
    }
    const initials = machine.initials.filter((initial) => initial.name === oldName);
    if (input.initial && machine.initials.some((initial) => initial.name !== oldName)) {
      // 既存の初期行を置き換える。重複行がある場合は構造化編集で曖昧さを隠さない。
      if (machine.initials.length !== 1) {
        return Result.err("初期状態の重複をモデル定義で修正してください");
      }
    }
    const replacements: (SourceReplacement | null)[] = [];
    if (input.name !== oldName) {
      replacements.push(...(resolution.references[oldName] ?? [])
        .filter((range) => {
          if (input.initial) {
            return true;
          }
          return !initials.some((initial) => initial.range.startLine === range.startLine);
        })
        .map((range) => replacementOf(source, range, input.name)));
    }
    if (input.terminal !== state.terminal) {
      // 名前の置換と同じ行を編集するため、先に状態行を名前ごと置き換える。
      const line = stateLine(source, state.range.startLine, input.terminal);
      if (line === null) {
        return Result.err("状態の行を特定できません");
      }
      replacements.splice(0, replacements.length, ...replacements.filter((item) => {
        if (item === null) {
          return true;
        }
        const withinStateLine = item.start >= line.start && item.end <= line.end;
        return !withinStateLine;
      }));
      const renamedLine = line.text.replace(/(\bstate:\s*)[^\s/]+/, (_match, prefix: string) => `${prefix}${input.name}`);
      replacements.push({ ...line, text: `${input.initial && machine.initials.length === 0 ? `  initial: ${input.name}${source.includes("\r\n") ? "\r\n" : "\n"}` : ""}${renamedLine}` });
    }
    if (input.initial && machine.initials.length === 0 && input.terminal === state.terminal) {
      const at = offsetOf(source, state.range.startLine, 1);
      replacements.push(at === null ? null : { start: at, end: at, text: `  initial: ${input.name}${source.includes("\r\n") ? "\r\n" : "\n"}` });
    }
    if (input.initial && machine.initials.length === 1 && initials.length === 0) {
      replacements.push(replacementOf(source, machine.initials[0]!.nameRange, input.name));
    }
    if (!input.initial && initials.length > 0) {
      replacements.push(...initials.map((initial) => removeLine(source, initial.range.startLine)));
    }
    return applyReplacements(source, replacements);
  },
  /** 遷移の3属性を、コメントと周囲の宣言を残して更新する。 */
  updateTransition(source: string, resolution: StateMachineResolution, input: StateMachineTransitionEdit): ResultValue<string, string> {
    const { machine } = resolution;
    const transition = machine.transitions.find((item) => item.range.startLine === input.range.startLine);
    if (transition === undefined) {
      return Result.err("編集する遷移を特定できません");
    }
    if (![input.from, input.to, input.event].every(Identifier.isAcceptable)) {
      return Result.err("遷移元・遷移先・イベント名を入力してください");
    }
    if (![input.from, input.to].every((name) => machine.states.some((state) => state.name === name))) {
      return Result.err("マシン内の状態を遷移元と遷移先に指定してください");
    }
    if (machine.states.some((state) => state.name === input.from && state.terminal)) {
      return Result.err("終端状態からは遷移できません");
    }
    if (machine.transitions.some((item) => item !== transition && transitionMatches(item, input))) {
      return Result.err("同じ遷移が既にあります");
    }
    return applyReplacements(source, [
      replacementOf(source, transition.fromRange, input.from),
      replacementOf(source, transition.toRange, input.to),
      replacementOf(source, transition.eventRange, input.event),
    ]);
  },
  /** 状態とその参照遷移、または選択した遷移をまとめて削除する。 */
  remove(source: string, resolution: StateMachineResolution, target: Readonly<{ kind: "state"; name: string } | { kind: "transition"; range: SourceRange }>): ResultValue<string, string> {
    const { machine } = resolution;
    if (target.kind === "transition") {
      const edge = machine.transitions.find((item) => item.range.startLine === target.range.startLine);
      if (edge === undefined) {
        return Result.err("遷移を特定できません");
      }
      return applyReplacements(source, [removeLine(source, edge.range.startLine)]);
    }
    const states = machine.states.filter((state) => state.name === target.name);
    if (states.length !== 1) {
      return Result.err("削除する状態を一意に特定できません");
    }
    const lines = [states[0]!.range.startLine,
      ...machine.initials.filter((initial) => initial.name === target.name).map((initial) => initial.range.startLine),
      ...machine.transitions.filter((edge) => [edge.from, edge.to].includes(target.name)).map((edge) => edge.range.startLine)];
    return applyReplacements(source, [...new Set(lines)].map((line) => removeLine(source, line)));
  },
} as const;
