import type { Diagnostic } from "../../diagnostic";
import { Primitive } from "../../primitive";
import { Result } from "../../result";
import { SourceRange, type SourceRange as Range } from "../../source-range";
import { TOKEN_KINDS } from "../../token";
import {
  TypeModifier,
  type TypeModifier as Modifier,
} from "../../type-modifier";
import { TypeTerm } from "../../type-term";
import { ChunkCursor, type WithCursor } from "../chunk-cursor";
import type { DeclChunk } from "../decl-chunk";
import { ExpectToken } from "../expect-token";

type ModifiersParse = Readonly<{
  modifiers: readonly Modifier[];
  endRange: Range;
}>;

/**
 * 後置修飾をすべて消費する。
 * @param cursor 型名の直後にあるカーソル。
 * @param endRange 直前に消費したトークンの範囲。
 * @param modifiers 収集済みの後置修飾。
 * @returns 後置修飾と消費後カーソル。
 */
const collectModifiers = (
  cursor: ChunkCursor,
  endRange: Range,
  modifiers: readonly Modifier[],
): WithCursor<ModifiersParse> => {
  const modifierToken = ChunkCursor.peek(cursor);
  if (
    modifierToken === undefined ||
    modifierToken.kind !== TOKEN_KINDS.reserved ||
    !TypeModifier.is(modifierToken.text)
  ) {
    return { cursor, value: { modifiers, endRange } };
  }
  const advanced = ChunkCursor.advance(cursor);
  return collectModifiers(
    advanced.cursor,
    modifierToken.range,
    [...modifiers, modifierToken.text],
  );
};

/** 型参照項を解析する関数群。 */
export const TypeTermParse = {
  /**
   * カーソル位置から型参照項と後置修飾を解析する。
   * @param cursor 型参照項の開始位置にあるカーソル。
   * @param chunk 宣言チャンク。
   * @returns 型参照項と消費後カーソル、または診断。
   */
  parse: (
    cursor: ChunkCursor,
    chunk: DeclChunk,
  ): Result<WithCursor<TypeTerm>, Diagnostic> => {
    const token = ChunkCursor.peek(cursor);
    if (token === undefined) {
      return Result.err(ExpectToken.errorAt("型参照が必要です", chunk.range));
    }
    if (token.kind !== TOKEN_KINDS.identifier) {
      return Result.err(
        ExpectToken.errorAt(
          "型参照の識別子またはプリミティブ型が必要です",
          token.range,
        ),
      );
    }
    const afterName = ChunkCursor.advance(cursor);
    const collected = collectModifiers(afterName.cursor, token.range, []);
    return Result.ok({
      cursor: collected.cursor,
      value: TypeTerm.create({
        name: token.text,
        isPrimitive: Primitive.is(token.text),
        modifiers: collected.value.modifiers,
        range: SourceRange.span(token.range, collected.value.endRange),
      }),
    });
  },
} as const;
