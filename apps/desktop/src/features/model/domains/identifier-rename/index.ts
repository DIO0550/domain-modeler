import {
  Identifier,
  Result,
  type Result as ResultType,
  type SourceRange,
  type ValueOf,
} from "@domain-modeler/model-core";
import { Option, type Option as OptionType } from "@/utils/Option";
import { CaretPosition, type CaretPosition as CaretPositionValue } from "../caret-position";
import type { TextEdit } from "../text-edit";

/** 識別子の出現を1回のテキスト編集で置き換えた結果。 */
export type IdentifierRename = Readonly<{
  edit: TextEdit;
  caret: CaretPositionValue;
}>;

/** 識別子リネームの失敗理由。 */
export const IDENTIFIER_RENAME_ERRORS = {
  invalidIdentifier: "invalid_identifier",
  nameNotFound: "name_not_found",
} as const;

/** 識別子リネームの失敗理由。 */
export type IdentifierRenameError = ValueOf<typeof IDENTIFIER_RENAME_ERRORS>;

type IdentifierRenameParams = Readonly<{
  source: string;
  ranges: readonly SourceRange[];
  nextName: string;
}>;

type OccurrenceOffset = Readonly<{
  start: number;
  end: number;
}>;

/**
 * ソース範囲を文字オフセットへ変換する。
 *
 * @param source 文書全文。
 * @param range 1始まりのソース範囲。
 * @returns 開始と終了のオフセット。行が文書に無ければ値なし。
 */
const offsetsOfRange = (
  source: string,
  range: SourceRange,
): OptionType<OccurrenceOffset> => {
  const start = CaretPosition.fromLineColumn(
    source,
    range.startLine,
    range.startColumn,
  );
  const end = CaretPosition.fromLineColumn(
    source,
    range.endLine,
    range.endColumn,
  );
  if (Option.isNone(start) || Option.isNone(end)) {
    return Option.none();
  }
  return Option.some({ start: start.value.offset, end: end.value.offset });
};

/**
 * 文書内の出現位置をオフセットへ変換する。
 *
 * @param source 文書全文。
 * @param ranges 出現範囲。
 * @returns 文書内にある出現のオフセット。開始位置の昇順。
 */
const occurrenceOffsets = (
  source: string,
  ranges: readonly SourceRange[],
): readonly OccurrenceOffset[] => {
  const offsets = ranges.flatMap((range) => {
    const occurrence = offsetsOfRange(source, range);
    if (Option.isNone(occurrence)) {
      return [];
    }
    return [occurrence.value];
  });
  return [...offsets].sort((left, right) => left.start - right.start);
};

/**
 * 先頭出現から末尾出現までの区間を新しい名前で書き換える。
 *
 * @param source 文書全文。
 * @param offsets 出現順のオフセット。1件以上。
 * @param nextName 新しい識別子。
 * @returns 区間の置換文字列。
 */
const replacementInSpan = (
  source: string,
  offsets: readonly OccurrenceOffset[],
  nextName: string,
): string => {
  const spanStart = offsets[0]?.start ?? 0;
  const spanEnd = offsets[offsets.length - 1]?.end ?? 0;
  const rewritten = offsets.reduce(
    (acc, occurrence) => ({
      text: `${acc.text}${source.slice(acc.cursor, occurrence.start)}${nextName}`,
      cursor: occurrence.end,
    }),
    { text: "", cursor: spanStart },
  );
  return `${rewritten.text}${source.slice(rewritten.cursor, spanEnd)}`;
};

/** 参照表の出現位置を新しい識別子で一括置換する関数群。 */
export const IdentifierRename = {
  /**
   * 与えた出現位置を新しい名前へ置き換える1回分の編集を作る。
   * 置換は先頭出現から末尾出現までの1区間なので、undo で丸ごと戻せる。
   *
   * @param params 文書全文・出現範囲・新しい名前。
   * @returns 一括編集と先頭出現のキャレット。名前が識別子でない、または出現が無ければ失敗。
   */
  create(
    params: IdentifierRenameParams,
  ): ResultType<IdentifierRename, IdentifierRenameError> {
    if (!Identifier.isAcceptable(params.nextName)) {
      return Result.err(IDENTIFIER_RENAME_ERRORS.invalidIdentifier);
    }
    const offsets = occurrenceOffsets(params.source, params.ranges);
    const first = offsets[0];
    const last = offsets[offsets.length - 1];
    if (first === undefined || last === undefined) {
      return Result.err(IDENTIFIER_RENAME_ERRORS.nameNotFound);
    }
    return Result.ok({
      edit: {
        start: first.start,
        end: last.end,
        replacement: replacementInSpan(params.source, offsets, params.nextName),
      },
      caret: CaretPosition.atOffset(params.source, first.start),
    });
  },
} as const;
