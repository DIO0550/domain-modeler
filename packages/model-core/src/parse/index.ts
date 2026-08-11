import type { Diagnostic } from "../diagnostic";
import { Document } from "../document";
import type { Token } from "../token";
import { Tokenizer } from "../tokenizer";
import { DataDeclParse } from "./data-decl";
import { DeclChunk } from "./decl-chunk";
import { WorkflowDeclParse } from "./workflow-decl";

/** パース結果(AST + トークン列 + 診断)。例外では失敗しない。 */
export type ParseResult = Readonly<{
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
}>;

/** `.dmodel` テキストを AST・トークン・診断へ解析する。 */
export const Parse = {
  /**
   * ソース全文を解析する。どんな入力でも例外を投げず結果を返す。
   * data 宣言と workflow 宣言を出現順に解析する。
   * @param source `.dmodel` テキスト。
   * @returns AST + トークン列 + 診断リスト。
   */
  parse: (source: string): ParseResult => {
    const tokens = Tokenizer.tokenize(source);
    const materialized = DeclChunk.split(tokens).map((chunk) =>
      chunk.kind === "data"
        ? DataDeclParse.materialize(chunk)
        : WorkflowDeclParse.materialize(chunk),
    );
    return {
      document: Document.create(
        materialized.map((item) => item.declaration),
        DeclChunk.rangeOf(tokens),
      ),
      tokens,
      diagnostics: materialized.flatMap((item) => item.diagnostics),
    };
  },
} as const;
