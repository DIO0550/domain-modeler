import { useLayoutEffect, useRef, type SyntheticEvent } from "react";

/** Preserve the native selection when React replaces the controlled text. */
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
    // An unavailable position after a full replacement returns to the start.
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
