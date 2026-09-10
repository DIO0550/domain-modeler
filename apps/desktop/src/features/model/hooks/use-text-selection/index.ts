import { useLayoutEffect, useRef, type SyntheticEvent } from "react";

/**
 * 制御されたテキストの更新前後で選択範囲とカーソル位置を保持する。
 * IME変換中は復元せず、確定時の選択位置を次の更新に引き継ぐ。
 *
 * @param value 親が保持する文書の全文。
 * @returns 入力要素への参照と、選択・IME変換を記録するイベントハンドラ。
 */
export function useTextSelection(value: string) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selection = useRef<{
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  }>({ start: 0, end: 0, direction: "none" });
  const composing = useRef(false);

  const rememberSelection = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    const input = event.currentTarget;
    selection.current = {
      start: input.selectionStart,
      end: input.selectionEnd,
      direction: input.selectionDirection,
    };
  };

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input === null || composing.current) {
      return;
    }
    const saved = selection.current;
    // 全文の置換で元の選択位置が失われた場合は文書先頭に戻す。
    const fits = saved.end <= input.value.length;
    const next = fits
      ? saved
      : { start: 0, end: 0, direction: "none" as const };
    selection.current = next;
    if (
      input.selectionStart !== next.start ||
      input.selectionEnd !== next.end ||
      input.selectionDirection !== next.direction
    ) {
      input.setSelectionRange(next.start, next.end, next.direction);
    }
  }, [value]);

  return {
    inputRef,
    rememberSelection,
    onCompositionStart: () => {
      composing.current = true;
    },
    onCompositionEnd: (event: SyntheticEvent<HTMLTextAreaElement>) => {
      composing.current = false;
      rememberSelection(event);
    },
  };
}
