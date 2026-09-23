import type { Diagnostic } from "../../diagnostic";
import { ErrorDecl } from "../../error-decl";
import { Primitive } from "../../primitive";
import { RESERVED_WORDS } from "../../reserved-word";
import { Result } from "../../result";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import {
  InitialStateRef,
  StateDecl,
  StateMachineDecl,
  TransitionDecl,
} from "../../state-machine-decl";
import { TOKEN_KINDS, type Token } from "../../token";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";
import type { MaterializedDecl } from "../materialized-decl";

type MachineLine = Readonly<{ tokens: readonly Token[]; indented: boolean }>;
type MachineItem =
  | Readonly<{ kind: "initial"; value: InitialStateRef }>
  | Readonly<{ kind: "state"; value: StateDecl }>
  | Readonly<{ kind: "transition"; value: TransitionDecl }>;

/** トークンの行境界を保持して、空行とコメント行だけを除く。 */
const linesOf = (tokens: readonly Token[]): readonly MachineLine[] => {
  const byLine = new Map<number, Token[]>();
  for (const token of tokens) {
    const line = token.range.startLine;
    byLine.set(line, [...(byLine.get(line) ?? []), token]);
  }
  return [...byLine.values()].flatMap((line) => {
    const meaningful = line.filter(
      (token) =>
        token.kind !== TOKEN_KINDS.indent &&
        token.kind !== TOKEN_KINDS.comment &&
        token.kind !== TOKEN_KINDS.blankLine,
    );
    if (meaningful.length === 0) {
      return [];
    }
    return [
      { tokens: meaningful, indented: line[0]?.kind === TOKEN_KINDS.indent },
    ];
  });
};

/** 欠落位置は行末の空範囲、誤ったトークンはその範囲を返す。 */
const problemRange = (tokens: readonly Token[], index: number): Range => {
  const token = tokens[index];
  if (token !== undefined) {
    return token.range;
  }
  const last = tokens[tokens.length - 1];
  if (last === undefined) {
    return SourceRange.onLine(1, 1, 1);
  }
  return SourceRange.onLine(
    last.range.endLine,
    last.range.endColumn,
    last.range.endColumn,
  );
};

const failure = (
  tokens: readonly Token[],
  index: number,
  message: string,
): Diagnostic => ExpectToken.errorAt(message, problemRange(tokens, index));

const identifierAt = (
  tokens: readonly Token[],
  index: number,
  label: string,
): Result<Token, Diagnostic> => {
  const token = tokens[index];
  if (token?.kind === TOKEN_KINDS.identifier && !Primitive.is(token.text)) {
    return Result.ok(token);
  }
  return Result.err(failure(tokens, index, `${label}の識別子が必要です`));
};

const noExtra = (
  tokens: readonly Token[],
  index: number,
): Result<true, Diagnostic> =>
  tokens[index] === undefined
    ? Result.ok(true)
    : Result.err(failure(tokens, index, "行末に余分なトークンがあります"));

const parseInitial = (
  tokens: readonly Token[],
): Result<MachineItem, Diagnostic> => {
  const name = identifierAt(tokens, 1, "初期状態名");
  if (Result.isErr(name)) {
    return name;
  }
  const end = noExtra(tokens, 2);
  if (Result.isErr(end)) {
    return end;
  }
  return Result.ok({
    kind: "initial",
    value: InitialStateRef.create({
      name: name.value.text,
      nameRange: name.value.range,
      range: SourceRange.span(
        tokens[0]?.range ?? name.value.range,
        name.value.range,
      ),
    }),
  });
};

const parseState = (
  tokens: readonly Token[],
): Result<MachineItem, Diagnostic> => {
  const name = identifierAt(tokens, 1, "状態名");
  if (Result.isErr(name)) {
    return name;
  }
  const terminal = tokens[2];
  if (
    terminal !== undefined &&
    (terminal.kind !== TOKEN_KINDS.reserved ||
      terminal.text !== RESERVED_WORDS.terminal)
  ) {
    return Result.err(failure(tokens, 2, "terminal または行末が必要です"));
  }
  const end = noExtra(tokens, terminal === undefined ? 2 : 3);
  if (Result.isErr(end)) {
    return end;
  }
  return Result.ok({
    kind: "state",
    value: StateDecl.create({
      name: name.value.text,
      nameRange: name.value.range,
      initial: false,
      terminal: terminal !== undefined,
      range: SourceRange.span(
        tokens[0]?.range ?? name.value.range,
        terminal?.range ?? name.value.range,
      ),
    }),
  });
};

const parseTransition = (
  tokens: readonly Token[],
): Result<MachineItem, Diagnostic> => {
  const from = identifierAt(tokens, 1, "遷移元");
  if (Result.isErr(from)) {
    return from;
  }
  if (tokens[2]?.kind !== TOKEN_KINDS.arrow) {
    return Result.err(failure(tokens, 2, "-> が必要です"));
  }
  const to = identifierAt(tokens, 3, "遷移先");
  if (Result.isErr(to)) {
    return to;
  }
  if (
    tokens[4]?.kind !== TOKEN_KINDS.reserved ||
    tokens[4]?.text !== RESERVED_WORDS.on
  ) {
    return Result.err(failure(tokens, 4, "on が必要です"));
  }
  const event = identifierAt(tokens, 5, "イベント名");
  if (Result.isErr(event)) {
    return event;
  }
  const end = noExtra(tokens, 6);
  if (Result.isErr(end)) {
    return end;
  }
  return Result.ok({
    kind: "transition",
    value: TransitionDecl.create({
      from: from.value.text,
      fromRange: from.value.range,
      to: to.value.text,
      toRange: to.value.range,
      event: event.value.text,
      eventRange: event.value.range,
      range: SourceRange.span(
        tokens[0]?.range ?? from.value.range,
        event.value.range,
      ),
    }),
  });
};

const parseItem = (line: MachineLine): Result<MachineItem, Diagnostic> => {
  const first = line.tokens[0];
  if (first === undefined) {
    return Result.err(failure(line.tokens, 0, "項目が必要です"));
  }
  if (!line.indented) {
    return Result.err(
      ExpectToken.errorAt("本文の項目にはインデントが必要です", first.range),
    );
  }
  if (first.text === RESERVED_WORDS["initial:"]) {
    return parseInitial(line.tokens);
  }
  if (first.text === RESERVED_WORDS["state:"]) {
    return parseState(line.tokens);
  }
  if (first.text === RESERVED_WORDS["transition:"]) {
    return parseTransition(line.tokens);
  }
  return Result.err(
    ExpectToken.errorAt("不明な state-machine の項目です", first.range),
  );
};

/** 有効なヘッダーから部分 AST を作り、壊れた本文行だけを診断して飛ばす。 */
export const StateMachineDeclParse = {
  materialize: (chunk: DeclChunk): MaterializedDecl => {
    const lines = linesOf(chunk.tokens);
    const header = lines[0]?.tokens ?? [];
    const keyword = header[0];
    const name = identifierAt(header, 1, "state-machine 名");
    const equals = header[2];
    const headerError = (() => {
      if (keyword?.text !== RESERVED_WORDS["state-machine"]) {
        return failure(header, 0, "state-machine が必要です");
      }
      if (Result.isErr(name)) {
        return name.error;
      }
      if (equals?.kind !== TOKEN_KINDS.equals) {
        return failure(header, 2, "= が必要です");
      }
      if (header[3] !== undefined) {
        return failure(header, 3, "ヘッダーの後に余分なトークンがあります");
      }
      return undefined;
    })();
    if (
      headerError !== undefined ||
      Result.isErr(name) ||
      keyword === undefined
    ) {
      return {
        declaration: ErrorDecl.create(chunk.range),
        diagnostics: [
          headerError ??
            failure(header, 1, "state-machine 名の識別子が必要です"),
        ],
      };
    }
    const parsed = lines.slice(1).map(parseItem);
    const items = parsed.flatMap((result) =>
      Result.isOk(result) ? [result.value] : [],
    );
    const initials = items.flatMap((item) =>
      item.kind === "initial" ? [item.value] : [],
    );
    const firstInitial = initials[0]?.name;
    const parsedStates = items.flatMap((item) =>
      item.kind === "state" ? [item.value] : [],
    );
    const initialIndex = parsedStates.findIndex(
      (state) => state.name === firstInitial,
    );
    const states = parsedStates.map((state, index) => ({
      ...state,
      initial: index === initialIndex,
    }));
    const transitions = items.flatMap((item) =>
      item.kind === "transition" ? [item.value] : [],
    );
    const lastLine = lines[lines.length - 1];
    const lastToken = lastLine?.tokens[lastLine.tokens.length - 1];
    return {
      declaration: StateMachineDecl.create({
        name: name.value.text,
        nameRange: name.value.range,
        initials,
        states,
        transitions,
        range: SourceRange.span(
          keyword.range,
          lastToken?.range ?? equals?.range ?? name.value.range,
        ),
      }),
      diagnostics: parsed.flatMap((result) =>
        Result.isErr(result) ? [result.error] : [],
      ),
    };
  },
} as const;
