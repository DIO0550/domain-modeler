import {
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
} from "react";
import { TextInput } from "@/libs/text-input";
import { TextEdit } from "../../domains/text-edit";
import { useTextSelection } from "../use-text-selection";

type TextEditingSession =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "composing"; text: string }>;

type UseTextEditingProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
}>;

/**
 * `.dmodel` の入力支援とIME変換中の表示境界を管理する。
 *
 * @param props 親が保持する全文と変更通知。
 * @returns textareaへ渡す全文・参照・入力イベントハンドラ。
 */
export function useTextEditing({ value, onChange }: UseTextEditingProps) {
  const [session, setSession] = useState<TextEditingSession>({
    status: "idle",
  });
  const displayedText = session.status === "composing" ? session.text : value;
  const selection = useTextSelection(displayedText);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    selection.rememberSelection(event);
    const text = event.currentTarget.value;
    if (session.status === "composing") {
      setSession({ status: "composing", text });
    }
    onChange(text);
  };

  const handleCompositionStart = (
    event: CompositionEvent<HTMLTextAreaElement>,
  ) => {
    selection.onCompositionStart();
    setSession({ status: "composing", text: event.currentTarget.value });
  };

  const handleCompositionEnd = (
    event: CompositionEvent<HTMLTextAreaElement>,
  ) => {
    selection.onCompositionEnd(event);
    const composedText = event.currentTarget.value;
    const externalUpdatePending =
      session.status === "composing" && value !== session.text;
    if (!externalUpdatePending && composedText !== value) {
      onChange(composedText);
    }
    setSession({ status: "idle" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      session.status === "composing" ||
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }
    const input = event.currentTarget;
    const source = {
      text: input.value,
      start: input.selectionStart,
      end: input.selectionEnd,
    };
    const edit =
      event.key === "Tab"
        ? TextEdit.insertTab(source)
        : event.key === "Enter"
          ? TextEdit.insertLineBreak(source)
          : null;
    if (edit === null) {
      return;
    }
    event.preventDefault();
    TextInput.applyEdit(input, edit);
  };

  return {
    inputRef: selection.inputRef,
    value: displayedText,
    onChange: handleChange,
    onSelect: selection.rememberSelection,
    onKeyDown: handleKeyDown,
    onCompositionStart: handleCompositionStart,
    onCompositionEnd: handleCompositionEnd,
  };
}
