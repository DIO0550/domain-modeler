import { type DataCardKind, DataDecl } from "../../data-decl";
import type { Diagnostic } from "../../diagnostic";
import type { DocumentDeclaration } from "../../document-declaration";
import type { NamedDecl } from "../../named-decl";
import { SourceRange } from "../../source-range";
import type { WorkflowDecl } from "../../workflow-decl";
import { ModelGraphReference } from "../reference";

/** 宣言または未定義名のノード。未定義名に宣言位置を捏造しない。 */
export type ModelGraphNode = Readonly<{
  id: string;
  name: string;
  label: string;
  range: SourceRange;
  references: readonly ModelGraphReference[];
  diagnostics: readonly Diagnostic[];
}> &
  (
    | Readonly<{ kind: "data"; cardKind: DataCardKind; declaration: DataDecl }>
    | Readonly<{ kind: "workflow"; declaration: WorkflowDecl }>
    | Readonly<{ kind: "unresolved"; occurrences: readonly SourceRange[] }>
  );

/** 宣言ASTと参照情報から、描画に依存しないノードを作る。 */
export const ModelGraphNode = {
  /** 同名宣言を行番号付きラベルで区別し、元の構成・制約を保持する。 */
  create(
    declaration: NamedDecl,
    context: Readonly<{
      declarations: readonly DocumentDeclaration[];
      references: readonly ModelGraphReference[];
      diagnostics: readonly Diagnostic[];
    }>,
  ): ModelGraphNode {
    const id = ModelGraphReference.declarationId(declaration);
    const duplicates = context.declarations.filter(
      (item) => item.name === declaration.name,
    );
    const label =
      duplicates.length > 1
        ? `${declaration.name} (行 ${declaration.nameRange.startLine})`
        : declaration.name;
    const common = {
      id,
      name: declaration.name,
      label,
      range: declaration.range,
      references: context.references.filter(
        (reference) => reference.from === id,
      ),
      diagnostics: context.diagnostics.filter((diagnostic) =>
        SourceRange.contains({
          outer: declaration.range,
          inner: diagnostic.range,
        }),
      ),
    };

    if (declaration.kind === "data") {
      return {
        ...common,
        kind: "data",
        cardKind: DataDecl.cardKind(declaration),
        declaration,
      };
    }

    return { ...common, kind: "workflow", declaration };
  },

  /** 同じ未定義名には1つだけ補助ノードを作り、全出現位置を残す。 */
  collectUnresolved(
    references: readonly ModelGraphReference[],
    diagnostics: readonly Diagnostic[],
  ): readonly ModelGraphNode[] {
    const unresolved = references.filter(
      (reference) => reference.resolution.kind === "unresolved",
    );

    return unresolved.flatMap((first, index) => {
      const name = first.term.name;

      if (
        unresolved
          .slice(0, index)
          .some((reference) => reference.term.name === name)
      ) {
        return [];
      }

      const occurrences = unresolved.filter(
        (reference) => reference.term.name === name,
      );

      return [
        {
          kind: "unresolved" as const,
          id: ModelGraphReference.unresolvedId(name),
          name,
          label: name,
          range: first.nameRange,
          references: [],
          occurrences: occurrences.map((reference) => reference.nameRange),
          diagnostics: diagnostics.filter((diagnostic) =>
            occurrences.some((reference) =>
              reference.diagnostics.includes(diagnostic),
            ),
          ),
        },
      ];
    });
  },
} as const;
