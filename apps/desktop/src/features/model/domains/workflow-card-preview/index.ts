import { WorkflowDecl, type TypeTerm } from "@domain-modeler/model-core";
import {
  PreviewTypeRef,
  type PreviewTypeRef as PreviewTypeRefValue,
} from "../preview-type-ref";

/** 構造化プレビューの workflow カード種別(model-editor.md §4.2)。 */
export const WORKFLOW_CARD_KIND = "WORKFLOW" as const;

/** workflow カードの節。 */
export const WORKFLOW_SECTION_KINDS = {
  input: "input",
  output: "output",
  error: "error",
} as const;

/** workflow カードの節ラベル。 */
export const WORKFLOW_SECTION_LABELS = {
  input: "IN",
  output: "OUT",
  error: "ERR",
} as const;

/** workflow カードの型参照区切り。input は AND、output / error は OR。 */
export const WORKFLOW_SECTION_SEPARATORS = {
  input: "+",
  output: "or",
  error: "or",
} as const;

/** workflow カードに出す1節。error は省略時この型に現れない。 */
export type WorkflowCardSection =
  | Readonly<{
      kind: typeof WORKFLOW_SECTION_KINDS.input;
      label: typeof WORKFLOW_SECTION_LABELS.input;
      separator: typeof WORKFLOW_SECTION_SEPARATORS.input;
      terms: readonly PreviewTypeRefValue[];
    }>
  | Readonly<{
      kind: typeof WORKFLOW_SECTION_KINDS.output;
      label: typeof WORKFLOW_SECTION_LABELS.output;
      separator: typeof WORKFLOW_SECTION_SEPARATORS.output;
      terms: readonly PreviewTypeRefValue[];
    }>
  | Readonly<{
      kind: typeof WORKFLOW_SECTION_KINDS.error;
      label: typeof WORKFLOW_SECTION_LABELS.error;
      separator: typeof WORKFLOW_SECTION_SEPARATORS.error;
      terms: readonly PreviewTypeRefValue[];
    }>;

/** workflow 宣言の構造化プレビュー(model-editor.md §4.2)。 */
export type WorkflowCardPreview = Readonly<{
  kind: typeof WORKFLOW_CARD_KIND;
  name: string;
  sections:
    | readonly [
        Extract<WorkflowCardSection, { kind: "input" }>,
        Extract<WorkflowCardSection, { kind: "output" }>,
      ]
    | readonly [
        Extract<WorkflowCardSection, { kind: "input" }>,
        Extract<WorkflowCardSection, { kind: "output" }>,
        Extract<WorkflowCardSection, { kind: "error" }>,
      ];
}>;

/** workflow 宣言からプレビューカードを組み立てる関数群。 */
export const WorkflowCardPreview = {
  /**
   * workflow 宣言と未定義名からプレビューカードを組み立てる。
   * error 節が無いときは ERR 行を含めない。
   * @param decl workflow 宣言。
   * @param undefinedTypeNames 未定義の型名。
   * @returns WORKFLOW プレビュー。
   */
  create(
    decl: WorkflowDecl,
    undefinedTypeNames: ReadonlySet<string>,
  ): WorkflowCardPreview {
    const input = inputSection(decl.input.terms, undefinedTypeNames);
    const output = outputSection(decl.output.terms, undefinedTypeNames);
    if (!WorkflowDecl.hasError(decl)) {
      return {
        kind: WORKFLOW_CARD_KIND,
        name: decl.name,
        sections: [input, output],
      };
    }
    return {
      kind: WORKFLOW_CARD_KIND,
      name: decl.name,
      sections: [
        input,
        output,
        errorSection(decl.error.terms, undefinedTypeNames),
      ],
    };
  },
} as const;

/**
 * input 節を IN / "+" のプレビュー節にする。
 * @param terms input の型参照項。
 * @param undefinedTypeNames 未定義の型名。
 * @returns IN 節。
 */
const inputSection = (
  terms: readonly TypeTerm[],
  undefinedTypeNames: ReadonlySet<string>,
): Extract<WorkflowCardSection, { kind: "input" }> => ({
  kind: WORKFLOW_SECTION_KINDS.input,
  label: WORKFLOW_SECTION_LABELS.input,
  separator: WORKFLOW_SECTION_SEPARATORS.input,
  terms: PreviewTypeRef.createMany(terms, undefinedTypeNames),
});

/**
 * output 節を OUT / "or" のプレビュー節にする。
 * @param terms output の型参照項。
 * @param undefinedTypeNames 未定義の型名。
 * @returns OUT 節。
 */
const outputSection = (
  terms: readonly TypeTerm[],
  undefinedTypeNames: ReadonlySet<string>,
): Extract<WorkflowCardSection, { kind: "output" }> => ({
  kind: WORKFLOW_SECTION_KINDS.output,
  label: WORKFLOW_SECTION_LABELS.output,
  separator: WORKFLOW_SECTION_SEPARATORS.output,
  terms: PreviewTypeRef.createMany(terms, undefinedTypeNames),
});

/**
 * error 節を ERR / "or" のプレビュー節にする。
 * @param terms error の型参照項。
 * @param undefinedTypeNames 未定義の型名。
 * @returns ERR 節。
 */
const errorSection = (
  terms: readonly TypeTerm[],
  undefinedTypeNames: ReadonlySet<string>,
): Extract<WorkflowCardSection, { kind: "error" }> => ({
  kind: WORKFLOW_SECTION_KINDS.error,
  label: WORKFLOW_SECTION_LABELS.error,
  separator: WORKFLOW_SECTION_SEPARATORS.error,
  terms: PreviewTypeRef.createMany(terms, undefinedTypeNames),
});
