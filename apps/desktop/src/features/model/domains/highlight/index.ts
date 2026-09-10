import {
  type Diagnostic,
  type SourceRange,
  type Token,
  Primitive,
  TOKEN_KINDS,
  TypeModifier,
} from "@domain-modeler/model-core";

/** 構文の色分け、または色分けと重ねて表示する診断範囲。 */
export type Highlight =
  | Readonly<{
      kind: "keyword" | "primitive" | "comment";
      range: SourceRange;
    }>
  | (Readonly<{ kind: "diagnostic" }> & Diagnostic);

/** model-core の位置情報を変更せず、エディタ表示用に分類する。 */
export const Highlight = {
  /**
   * トークンと診断からハイライト範囲を収集する。
   * 識別子・数値・記号・空白は標準色のため返さない。
   * 診断は構文範囲の後に入力順で追加し、重なりや空範囲も保持する。
   * @param tokens 同じソースから得た model-core のトークン列。
   * @param diagnostics 同じソースに対する診断列。
   * @returns 行・桁が1始まり、終端が排他的なハイライト範囲。
   */
  collect: (
    tokens: readonly Token[],
    diagnostics: readonly Diagnostic[],
  ): readonly Highlight[] => {
    const syntax = tokens.flatMap((token): readonly Highlight[] => {
      const { kind, text, range } = token;
      if (kind === TOKEN_KINDS.comment) {
        return [{ kind: "comment", range }];
      }
      if (kind === TOKEN_KINDS.reserved) {
        return [{ kind: TypeModifier.is(text) ? "primitive" : "keyword", range }];
      }
      if (kind === TOKEN_KINDS.identifier && Primitive.is(text)) {
        return [{ kind: "primitive", range }];
      }
      return [];
    });
    const diagnosticRanges = diagnostics.map(
      (diagnostic): Highlight => ({ ...diagnostic, kind: "diagnostic" }),
    );
    return [...syntax, ...diagnosticRanges];
  },
} as const;
