import type { Diagnostic } from "../diagnostic";
import { Document } from "../document";
import { ErrorDecl } from "../error-decl";
import type { Token } from "../token";
import { Tokenizer } from "../tokenizer";
import { DataDeclParse } from "./data-decl";
import { DeclChunk } from "./decl-chunk";
import { ExpectToken } from "./expect-token";
import type { MaterializedDecl } from "./materialized-decl";
import { WorkflowDeclParse } from "./workflow-decl";

/** パース結果(AST + トークン列 + 診断)。例外では失敗しない。 */
export type ParseResult = Readonly<{
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
}>;

/**
 * 宣言チャンクを AST 宣言と診断へ変換する。
 * 不正な宣言や孤立トークンでも次チャンクの解析は継続する。
 * @param chunk 宣言チャンク。
 * @returns 宣言と診断。
 */
const materializeChunk = (chunk: DeclChunk): MaterializedDecl => {
  if (chunk.kind === "data") {
    return DataDeclParse.materialize(chunk);
  }
  if (chunk.kind === "workflow") {
    return WorkflowDeclParse.materialize(chunk);
  }
  return {
    declaration: ErrorDecl.create(chunk.range),
    diagnostics: [
      ExpectToken.errorAt(
        "data または workflow で始まる宣言が必要です",
        chunk.range,
      ),
    ],
  };
};

/** `.dmodel` テキストを AST・トークン・診断へ解析する。 */
export const Parse = {
  /**
   * ソース全文を解析する。どんな入力でも例外を投げず結果を返す。
   * data / workflow を出現順に解析し、壊れた宣言の次からも継続する。
   * @param source `.dmodel` テキスト。
   * @returns AST + トークン列 + 診断リスト。
   */
  parse: (source: string): ParseResult => {
    const tokens = Tokenizer.tokenize(source);
    const materialized = DeclChunk.split(tokens).map(materializeChunk);
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
