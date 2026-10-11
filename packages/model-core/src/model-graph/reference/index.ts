import { DefinitionTable } from "../../definition-table";
import type { Diagnostic } from "../../diagnostic";
import type { DocumentDeclaration } from "../../document-declaration";
import type { NamedDecl } from "../../named-decl";
import { SourceRange } from "../../source-range";
import { TypeTerm } from "../../type-term";

/** 型参照の出現箇所。プリミティブと図の対象外は辺の終点を持たない。 */
export type ModelGraphReference = Readonly<{
  id: string;
  from: string;
  role: "component" | "choice" | "alias" | "input" | "output" | "error";
  term: TypeTerm;
  nameRange: SourceRange;
  diagnostics: readonly Diagnostic[];
  resolution:
    | Readonly<{ kind: "primitive" }>
    | Readonly<{ kind: "unresolved"; to: string }>
    | Readonly<{ kind: "resolved"; to: string; definition: NamedDecl }>
    | Readonly<{
        kind: "outside";
        definition: Extract<DocumentDeclaration, { kind: "state-machine" }>;
      }>;
}>;

/** 宣言の参照項と解決先を、出現位置ごとに保持する。 */
export const ModelGraphReference = {
  /** 名前ではなく宣言位置から、一解析結果内で一意なIDを作る。 */
  declarationId(declaration: DocumentDeclaration): string {
    const { startLine, startColumn } = declaration.nameRange;

    return `declaration:${declaration.kind}:${startLine}:${startColumn}`;
  },

  /** 宣言IDと別の識別子空間に、未定義名を置く。 */
  unresolvedId(name: string): string {
    return `unresolved:${name}`;
  },

  /** 既存の定義表による解決結果を、表示対象の有無とともに返す。 */
  resolution(
    term: TypeTerm,
    definitions: DefinitionTable,
  ): ModelGraphReference["resolution"] {
    if (term.isPrimitive) {
      return { kind: "primitive" };
    }

    if (!DefinitionTable.has(definitions, term.name)) {
      return {
        kind: "unresolved",
        to: ModelGraphReference.unresolvedId(term.name),
      };
    }

    const definition = definitions[term.name];

    if (definition.kind === "state-machine") {
      return { kind: "outside", definition };
    }

    return {
      kind: "resolved",
      to: ModelGraphReference.declarationId(definition),
      definition,
    };
  },

  /** 宣言の項を役割付きで列挙する。制約付きVALUEの情報は宣言ASTに残す。 */
  collectTerms(declaration: NamedDecl): readonly Readonly<{
    role: ModelGraphReference["role"];
    term: TypeTerm;
  }>[] {
    if (declaration.kind === "data") {
      const expression = declaration.typeExpr;

      switch (expression.form) {
        case "alias":
          return [{ role: "alias", term: expression.term }];
        case "record":
          return expression.terms.map((term) => ({ role: "component", term }));
        case "choice":
          return expression.terms.map((term) => ({ role: "choice", term }));
        case "value":
          return [];
      }
    }

    const input = declaration.input.terms.map(
      (term) => ({ role: "input", term }) as const,
    );
    const output = declaration.output.terms.map(
      (term) => ({ role: "output", term }) as const,
    );
    const error = declaration.error.present
      ? declaration.error.terms.map(
          (term) => ({ role: "error", term }) as const,
        )
      : [];

    return [...input, ...output, ...error];
  },

  /** 各項の修飾順・項全体の範囲・型名範囲と既存診断を保持する。 */
  collect(
    declaration: NamedDecl,
    definitions: DefinitionTable,
    diagnostics: readonly Diagnostic[],
  ): readonly ModelGraphReference[] {
    const from = ModelGraphReference.declarationId(declaration);

    return ModelGraphReference.collectTerms(declaration).map(
      ({ role, term }) => ({
        id: `${from}/reference:${term.range.startLine}:${term.range.startColumn}`,
        from,
        role,
        term,
        nameRange: TypeTerm.nameRange(term),
        diagnostics: diagnostics.filter((diagnostic) =>
          SourceRange.contains({ outer: term.range, inner: diagnostic.range }),
        ),
        resolution: ModelGraphReference.resolution(term, definitions),
      }),
    );
  },
} as const;
