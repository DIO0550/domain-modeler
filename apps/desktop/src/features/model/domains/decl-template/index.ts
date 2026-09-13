import type { ValueOf } from "@domain-modeler/model-core";
import { CaretPosition } from "../caret-position";
import type { TextEdit } from "../text-edit";

/** data / workflow 宣言の雛形の種類。 */
export const DECL_TEMPLATE_KINDS = {
  data: "data",
  workflow: "workflow",
} as const;

/** data / workflow 宣言の雛形の種類。 */
export type DeclTemplateKind = ValueOf<typeof DECL_TEMPLATE_KINDS>;

/** カーソル位置へ挿入する宣言雛形。 */
export type DeclTemplate = Readonly<{
  kind: DeclTemplateKind;
  source: string;
  nameStart: number;
  nameEnd: number;
}>;

/** 雛形を挿入した1回分の編集と、名前部分の選択範囲。 */
export type DeclTemplateInsertion = Readonly<{
  edit: TextEdit;
  nameStart: number;
  nameEnd: number;
  line: number;
}>;

type InsertCaret = Readonly<{
  source: string;
  start: number;
  end: number;
}>;

/** 雛形の名前プレースホルダ。挿入直後に選択する。 */
const TEMPLATE_NAME = "名前";

/**
 * 名前プレースホルダを含む雛形テキストから雛形を作る。
 *
 * @param kind 宣言の種類。
 * @param source 雛形テキスト。
 * @returns 名前範囲付きの雛形。
 */
const fromSource = (kind: DeclTemplateKind, source: string): DeclTemplate => {
  const nameStart = source.indexOf(TEMPLATE_NAME);
  return {
    kind,
    source,
    nameStart,
    nameEnd: nameStart + TEMPLATE_NAME.length,
  };
};

/**
 * 直前の文字が行末か判定する。
 *
 * @param char 判定する文字。文書先頭なら値なし。
 * @returns 改行、または文書先頭なら `true`。
 */
const isLineStart = (char: string | undefined): boolean =>
  char === undefined || char === "\n" || char === "\r";

/**
 * 直後の文字が行頭か判定する。
 *
 * @param char 判定する文字。文書末尾なら値なし。
 * @returns 改行、または文書末尾なら `true`。
 */
const isLineEnd = (char: string | undefined): boolean =>
  char === undefined || char === "\n" || char === "\r";

/** data / workflow 宣言の雛形を生成し、カーソル位置へ挿入する関数群。 */
export const DeclTemplate = {
  /**
   * data 宣言の雛形を返す。
   *
   * @returns 名前プレースホルダ付きの data 雛形。
   */
  data(): DeclTemplate {
    return fromSource(
      DECL_TEMPLATE_KINDS.data,
      `data ${TEMPLATE_NAME} = string`,
    );
  },
  /**
   * workflow 宣言の雛形を返す。
   *
   * @returns 名前プレースホルダ付きの workflow 雛形。
   */
  workflow(): DeclTemplate {
    return fromSource(
      DECL_TEMPLATE_KINDS.workflow,
      `workflow ${TEMPLATE_NAME} =\n  input: string\n  output: string`,
    );
  },
  /**
   * カーソル位置(または選択範囲)へ雛形を挿入する編集を作る。
   * 行の途中なら前後を改行で区切り、挿入直後に名前部分を選択できるようにする。
   *
   * @param template 挿入する雛形。
   * @param caret 文書全文と置換範囲。
   * @returns 1回分の編集と名前部分の選択範囲。
   */
  insert(template: DeclTemplate, caret: InsertCaret): DeclTemplateInsertion {
    const charBefore =
      caret.start === 0 ? undefined : caret.source[caret.start - 1];
    const charAfter =
      caret.end === caret.source.length ? undefined : caret.source[caret.end];
    const prefix = isLineStart(charBefore) ? "" : "\n";
    const suffix = isLineEnd(charAfter) ? "" : "\n";
    const replacement = `${prefix}${template.source}${suffix}`;
    const nameStart = caret.start + prefix.length + template.nameStart;
    const nameEnd = caret.start + prefix.length + template.nameEnd;
    const nextSource = `${caret.source.slice(0, caret.start)}${replacement}${caret.source.slice(caret.end)}`;
    return {
      edit: {
        start: caret.start,
        end: caret.end,
        replacement,
      },
      nameStart,
      nameEnd,
      line: CaretPosition.atOffset(nextSource, nameStart).line,
    };
  },
} as const;
