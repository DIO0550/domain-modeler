import {
  DIAGNOSTIC_SEVERITIES,
  SourceRange,
  type Diagnostic,
} from "@domain-modeler/model-core";
import { ArrayEx } from "@/utils/ArrayEx";

/** エディタ1行内の、通常色または警告下線の区間。 */
export type EditorLineSegment =
  | Readonly<{ kind: "plain"; text: string }>
  | Readonly<{ kind: "warning"; text: string }>;

/** 行のエラー装飾。継続行はメッセージが空でもエラー背景の対象。 */
export type EditorLineErrorMark =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "error"; messages: readonly string[] }>;

/** エディタ1行分の診断表示。 */
export type EditorLineView = Readonly<{
  line: number;
  segments: readonly EditorLineSegment[];
  errorMark: EditorLineErrorMark;
}>;

/** 1始まり・終端排他の桁範囲。 */
type ColumnRange = Readonly<{
  startColumn: number;
  endColumn: number;
}>;

/**
 * ソースを行に分割する。末尾改行は最終の空行として残す。
 * @param source 文書全文。
 * @returns 行テキスト。
 */
const splitLines = (source: string): readonly string[] =>
  source.split(/\r\n|\r|\n/);

/**
 * 空でない桁範囲を開始桁順にまとめ、重なりと接触を結合する。
 * @param ranges 1始まり・終端排他の桁範囲。
 * @returns 重なりのない桁範囲。
 */
const mergeColumnRanges = (
  ranges: readonly ColumnRange[],
): readonly ColumnRange[] => {
  const filtered = ranges.filter((range) => range.endColumn > range.startColumn);
  const sorted = [...filtered].sort(
    (left, right) =>
      left.startColumn - right.startColumn || left.endColumn - right.endColumn,
  );
  return sorted.reduce<readonly ColumnRange[]>((merged, range) => {
    const last = merged[merged.length - 1];
    if (last === undefined) {
      return [range];
    }
    if (range.startColumn > last.endColumn) {
      return [...merged, range];
    }
    return [
      ...merged.slice(0, -1),
      {
        startColumn: last.startColumn,
        endColumn: Math.max(last.endColumn, range.endColumn),
      },
    ];
  }, []);
};

/**
 * 警告範囲を1行上の桁範囲へ切り取る。
 * @param range 診断範囲。
 * @param line 対象行(1始まり)。
 * @param lineLength 行の文字数。
 * @returns その行に掛かる桁範囲。掛からなければ空。
 */
const clipWarningToLine = (
  range: SourceRange,
  line: number,
  lineLength: number,
): readonly ColumnRange[] => {
  if (!SourceRange.coversLine(range, line)) {
    return [];
  }
  const startColumn = range.startLine === line ? range.startColumn : 1;
  const rawEndColumn =
    range.endLine === line ? range.endColumn : lineLength + 1;
  const endColumn = Math.min(rawEndColumn, lineLength + 1);
  if (endColumn <= startColumn) {
    return [];
  }
  return [{ startColumn, endColumn }];
};

/**
 * 行テキストを警告区間で分割する。
 * @param text 行テキスト。
 * @param warnings その行の警告桁範囲。
 * @returns 通常区間と警告区間。
 */
const segmentsOf = (
  text: string,
  warnings: readonly ColumnRange[],
): readonly EditorLineSegment[] => {
  const merged = mergeColumnRanges(warnings);
  if (merged.length === 0) {
    return [{ kind: "plain", text }];
  }
  const split = merged.reduce<
    Readonly<{ segments: readonly EditorLineSegment[]; cursor: number }>
  >(
    (acc, range) => {
      const before = text.slice(acc.cursor - 1, range.startColumn - 1);
      const warning = text.slice(range.startColumn - 1, range.endColumn - 1);
      const withBefore =
        before.length === 0
          ? acc.segments
          : [...acc.segments, { kind: "plain" as const, text: before }];
      const withWarning =
        warning.length === 0
          ? withBefore
          : [...withBefore, { kind: "warning" as const, text: warning }];
      return { segments: withWarning, cursor: range.endColumn };
    },
    { segments: [], cursor: 1 },
  );
  const tail = text.slice(split.cursor - 1);
  if (tail.length === 0) {
    return split.segments.length === 0
      ? [{ kind: "plain", text: "" }]
      : split.segments;
  }
  return [...split.segments, { kind: "plain", text: tail }];
};

/**
 * 診断を行番号へ一度だけ振り分ける。
 * @param lines 表示中の各行。
 * @param diagnostics パースと参照解決の診断。
 * @returns 行ごとの警告桁範囲とエラー診断。
 */
const bucketByLine = (
  lines: readonly string[],
  diagnostics: readonly Diagnostic[],
): Readonly<{
  warnings: readonly (readonly ColumnRange[])[];
  errors: readonly (readonly Diagnostic[])[];
}> => {
  const warnings = lines.map((): ColumnRange[] => []);
  const errors = lines.map((): Diagnostic[] => []);
  for (const diagnostic of diagnostics) {
    const first = Math.max(1, diagnostic.range.startLine);
    const last = Math.min(lines.length, diagnostic.range.endLine);
    for (let line = first; line <= last; line += 1) {
      const text = lines[line - 1] ?? "";
      if (diagnostic.severity === DIAGNOSTIC_SEVERITIES.warning) {
        warnings[line - 1]?.push(
          ...clipWarningToLine(diagnostic.range, line, text.length),
        );
      }
      if (diagnostic.severity === DIAGNOSTIC_SEVERITIES.error) {
        errors[line - 1]?.push(diagnostic);
      }
    }
  }
  return { warnings, errors };
};

/**
 * 行のエラー装飾を決める。
 * @param line 行番号(1始まり)。
 * @param covering その行を覆うエラー診断。
 * @returns エラーなし、または背景と開始行のメッセージ。
 */
const errorMarkOf = (
  line: number,
  covering: readonly Diagnostic[],
): EditorLineErrorMark => {
  if (covering.length === 0) {
    return { kind: "none" };
  }
  const messages = ArrayEx.unique(
    covering
      .filter((diagnostic) => diagnostic.range.startLine === line)
      .map((diagnostic) => diagnostic.message),
  );
  return { kind: "error", messages };
};

/** 診断をエディタ行の装飾へ変換する関数群。 */
export const EditorDiagnostic = {
  /**
   * ソースと診断から、行ごとの背景・行末メッセージ・警告下線を組み立てる。
   * エラーは行背景、警告は識別子の点線下線とし、警告だけで行をエラーにしない。
   * @param source 表示中の文書全文。
   * @param diagnostics パースと参照解決の診断。
   * @returns 全行の表示。
   */
  lineViews(
    source: string,
    diagnostics: readonly Diagnostic[],
  ): readonly EditorLineView[] {
    const lines = splitLines(source);
    const buckets = bucketByLine(lines, diagnostics);
    return lines.map((text, index) => ({
      line: index + 1,
      segments: segmentsOf(text, buckets.warnings[index] ?? []),
      errorMark: errorMarkOf(index + 1, buckets.errors[index] ?? []),
    }));
  },
} as const;
