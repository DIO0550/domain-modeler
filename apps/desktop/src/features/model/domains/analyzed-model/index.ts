import {
  DefinitionTable,
  NamedDecl,
  Parse,
  ReferenceTable,
  Resolve,
  TypeTerm,
  type DefinitionTable as DefinitionTableValue,
  type Diagnostic,
  type Document,
  type ReferenceTable as ReferenceTableValue,
  type Result as ResultType,
  type Token,
} from "@domain-modeler/model-core";
import { Option, type Option as OptionType } from "@/utils/Option";
import { CaretPosition, type CaretPosition as CaretPositionValue } from "../caret-position";
import {
  IdentifierRename,
  type IdentifierRename as IdentifierRenameValue,
  type IdentifierRenameError,
} from "../identifier-rename";

/** パースと参照解決をまとめた文書。 */
export type AnalyzedModel = Readonly<{
  source: string;
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
  definitions: DefinitionTableValue;
  references: ReferenceTableValue;
  undefinedTypeNames: ReadonlySet<string>;
}>;

/**
 * 未定義の型名を定義表から集める。
 *
 * @param document パース済みの文書。
 * @param definitions 名前付き宣言の定義表。
 * @returns 未定義の型名。
 */
const collectUndefinedTypeNames = (
  document: AnalyzedModel["document"],
  definitions: DefinitionTableValue,
): ReadonlySet<string> => {
  const namedDeclarations = document.declarations.filter(NamedDecl.is);
  return new Set(
    namedDeclarations.flatMap((decl) =>
      NamedDecl.referencedTerms(decl)
        .filter(TypeTerm.isResolvable)
        .filter((term) => !DefinitionTable.has(definitions, term.name))
        .map((term) => term.name),
    ),
  );
};

/** 入力テキストからパースと参照解決の結果を組み立てる関数群。 */
export const AnalyzedModel = {
  /**
   * ソース全文を解析し、パース診断と参照解決診断をまとめる。
   * 失敗しても例外は投げず、診断として返す。
   * @param source `.dmodel` テキスト。
   * @returns 文書・トークン・診断・定義表・参照表・未定義型名。
   */
  create(source: string): AnalyzedModel {
    const parsed = Parse.parse(source);
    const resolved = Resolve.resolve(parsed.document);
    const diagnostics = [...parsed.diagnostics, ...resolved.diagnostics];
    const namedDeclarations = parsed.document.declarations.filter(NamedDecl.is);
    const definitions = DefinitionTable.create(namedDeclarations);
    return {
      source,
      document: parsed.document,
      tokens: parsed.tokens,
      diagnostics,
      definitions,
      references: resolved.references,
      undefinedTypeNames: collectUndefinedTypeNames(
        parsed.document,
        definitions,
      ),
    };
  },
  /**
   * 型名の定義宣言先頭へジャンプするキャレットを返す。
   *
   * @param model 解析済みの文書。
   * @param name ジャンプしたい型名。
   * @returns 定義があればその先頭。無ければ値なし。
   */
  caretOfDefinition(
    model: AnalyzedModel,
    name: string,
  ): OptionType<CaretPositionValue> {
    const decl = model.definitions[name];
    if (!DefinitionTable.has(model.definitions, name) || decl === undefined) {
      return Option.none();
    }
    return CaretPosition.fromRange(model.source, decl.range);
  },
  /**
   * 宣言名と型参照の出現を新しい名前へ一括置換する。
   * 置換対象は参照表のトークン位置だけで、コメント内の同名文字列は含まない。
   *
   * @param model 解析済みの文書。
   * @param names 現在の識別子と新しい識別子。
   * @returns 1回分の編集と先頭出現のキャレット。名前が識別子でない、または出現が無ければ失敗。
   */
  rename(
    model: AnalyzedModel,
    names: Readonly<{ currentName: string; nextName: string }>,
  ): ResultType<IdentifierRenameValue, IdentifierRenameError> {
    return IdentifierRename.create({
      source: model.source,
      ranges: ReferenceTable.rangesOf(model.references, names.currentName),
      nextName: names.nextName,
    });
  },
} as const;
