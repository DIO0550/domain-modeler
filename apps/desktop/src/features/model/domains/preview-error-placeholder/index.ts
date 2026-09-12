import {
  DIAGNOSTIC_SEVERITIES,
  SourceRange,
  type Diagnostic,
  type ErrorDecl,
} from "@domain-modeler/model-core";
import { ArrayEx } from "@/utils/ArrayEx";

/** プレビュー上のエラープレースホルダ(model-editor.md §4.3)。 */
export type PreviewErrorPlaceholder = Readonly<{
  startLine: number;
  messages: readonly string[];
}>;

/** 壊れた宣言からプレビュー用プレースホルダを組み立てる関数群。 */
export const PreviewErrorPlaceholder = {
  /**
   * エラー宣言と、その範囲に掛かるエラー診断からプレースホルダを作る。
   * 警告はプレースホルダに載せない。
   * @param decl 解釈できなかった宣言。
   * @param diagnostics 同じソースの診断。
   * @returns 開始行とエラーメッセージ。
   */
  create(
    decl: ErrorDecl,
    diagnostics: readonly Diagnostic[],
  ): PreviewErrorPlaceholder {
    const messages = ArrayEx.unique(
      diagnostics
        .filter(
          (diagnostic) =>
            diagnostic.severity === DIAGNOSTIC_SEVERITIES.error &&
            SourceRange.coversLine(decl.range, diagnostic.range.startLine),
        )
        .map((diagnostic) => diagnostic.message),
    );
    return {
      startLine: decl.range.startLine,
      messages,
    };
  },
} as const;
