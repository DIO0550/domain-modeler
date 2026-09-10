import { useRef } from "react";
import { useTextSelection } from "../../hooks/use-text-selection";
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
  const selection = useTextSelection(value);
  const lines = value.split(/\r\n|\r|\n/);

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
        ref={selection.inputRef}
        className="model-editor__input"
        aria-label="ドメインモデルのテキスト"
        value={value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => {
          selection.rememberSelection(event);
          onChange(event.currentTarget.value);
        }}
        onSelect={selection.rememberSelection}
        onCompositionStart={selection.onCompositionStart}
        onCompositionEnd={selection.onCompositionEnd}
        onScroll={(event) => {
          if (gutterRef.current !== null) {
            gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }
        }}
      />
    </div>
  );
}
