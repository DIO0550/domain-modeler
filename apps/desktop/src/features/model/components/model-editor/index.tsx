import { useRef } from "react";
import { useTextEditing } from "../../hooks/use-text-editing";
import "./ModelEditor.css";

type ModelEditorProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
}>;

/**
 * 行番号付きの .dmodel プレーンテキスト入力欄。全文は親が保持する。
 *
 * @param props 全文と変更通知。親は通知された全文を同期的に反映する。
 * @returns 選択範囲とカーソル位置を保持するテキストエディタ。
 */
export function ModelEditor({ value, onChange }: ModelEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const editing = useTextEditing({ value, onChange });
  const lines = editing.value.split(/\r\n|\r|\n/);

  return (
    <div className="model-editor">
      <div className="model-editor__gutter" ref={gutterRef} aria-hidden="true">
        <div className="model-editor__line-numbers">
          {lines.map((_, index) => (
            <div key={index + 1}>{index + 1}</div>
          ))}
        </div>
      </div>
      <textarea
        ref={editing.inputRef}
        className="model-editor__input"
        aria-label="ドメインモデルのテキスト"
        value={editing.value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={editing.onChange}
        onSelect={editing.onSelect}
        onKeyDown={editing.onKeyDown}
        onCompositionStart={editing.onCompositionStart}
        onCompositionEnd={editing.onCompositionEnd}
        onScroll={(event) => {
          if (gutterRef.current !== null) {
            gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }
        }}
      />
    </div>
  );
}
