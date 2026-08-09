import type { SourceRange } from "../source-range";
import type { ValueOf } from "../types/value-of";

/** 診断深刻度の列挙値(model-core.md §6)。 */
export const DIAGNOSTIC_SEVERITIES = {
  error: "error",
  warning: "warning",
} as const;

/** 診断深刻度。 */
export type DiagnosticSeverity = ValueOf<typeof DIAGNOSTIC_SEVERITIES>;

/** 位置付きの診断(エラーまたは警告)。 */
export type Diagnostic = Readonly<{
  severity: DiagnosticSeverity;
  message: string;
  range: SourceRange;
}>;

/** 診断を生成する関数群。 */
export const Diagnostic = {
  /**
   * 深刻度・メッセージ・位置から診断を生成する。
   * @param severity 深刻度。
   * @param message 人が読めるメッセージ(日本語)。
   * @param range 対象のソース範囲。
   * @returns 診断。
   */
  create: (
    severity: DiagnosticSeverity,
    message: string,
    range: SourceRange,
  ): Diagnostic => ({ severity, message, range }),
} as const;
