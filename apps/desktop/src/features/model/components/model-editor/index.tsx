import { useMemo, useRef, type RefObject, type UIEvent } from "react";
import { AnalyzedModel } from "../../domains/analyzed-model";
import {
  EditorDiagnostic,
  type EditorLineView,
} from "../../domains/editor-diagnostic";
import { useTextEditing } from "../../hooks/use-text-editing";
import "./ModelEditor.css";

type ModelEditorProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
}>;

/**
 * 行番号付きの .dmodel プレーンテキスト入力欄。全文は親が保持する。
 * パースエラーは行背景と行末メッセージ、未定義参照は点線下線で示す。
 *
 * @param props 全文と変更通知。親は通知された全文を同期的に反映する。
 * @returns 選択範囲とカーソル位置を保持するテキストエディタ。
 */
export function ModelEditor({ value, onChange }: ModelEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const diagnosticsRef = useRef<HTMLDivElement>(null);
  const editing = useTextEditing({ value, onChange });
  const lineViews = useMemo(() => {
    const analyzed = AnalyzedModel.from(editing.value);
    return EditorDiagnostic.lineViews(editing.value, analyzed.diagnostics);
  }, [editing.value]);

  return (
    <div className="model-editor">
      <div className="model-editor__gutter" ref={gutterRef} aria-hidden="true">
        <div className="model-editor__line-numbers">
          {lineViews.map((lineView) => (
            <div key={lineView.line}>{lineView.line}</div>
          ))}
        </div>
      </div>
      <div className="model-editor__surface">
        <EditorDiagnosticsOverlay
          lineViews={lineViews}
          overlayRef={diagnosticsRef}
        />
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
          onScroll={(event) => syncEditorScroll(event, gutterRef, diagnosticsRef)}
        />
      </div>
    </div>
  );
}

type EditorDiagnosticsOverlayProps = Readonly<{
  lineViews: readonly EditorLineView[];
  overlayRef: RefObject<HTMLDivElement | null>;
}>;

/**
 * 入力欄の背後に、エラー行背景・行末メッセージ・警告下線を重ねる。
 *
 * @param props 行ごとの診断表示とスクロール同期用の参照。
 * @returns ポインタを通す診断レイヤ。
 */
function EditorDiagnosticsOverlay({
  lineViews,
  overlayRef,
}: EditorDiagnosticsOverlayProps) {
  return (
    <div
      className="model-editor__diagnostics"
      ref={overlayRef}
      aria-hidden="true"
    >
      {lineViews.map((lineView) => (
        <EditorDiagnosticLine key={lineView.line} lineView={lineView} />
      ))}
    </div>
  );
}

type EditorDiagnosticLineProps = Readonly<{
  lineView: EditorLineView;
}>;

/**
 * 1行分の診断装飾を描画する。
 *
 * @param props 行の表示。
 * @returns 行ボックス。
 */
function EditorDiagnosticLine({ lineView }: EditorDiagnosticLineProps) {
  const className =
    lineView.errorMark.kind === "error"
      ? "model-editor__diagnostics-line model-editor__diagnostics-line--error"
      : "model-editor__diagnostics-line";
  return (
    <div className={className} data-line={lineView.line}>
      {lineView.segments.map((segment, index) => (
        <span
          key={`${lineView.line}-${index}`}
          className={
            segment.kind === "warning"
              ? "model-editor__diagnostics-warning"
              : undefined
          }
        >
          {segment.text}
        </span>
      ))}
      <EndOfLineMessage errorMark={lineView.errorMark} />
    </div>
  );
}

type EndOfLineMessageProps = Readonly<{
  errorMark: EditorLineView["errorMark"];
}>;

/**
 * エラー開始行の行末にメッセージを出す。
 *
 * @param props 行のエラー装飾。
 * @returns 行末メッセージ。無ければ何も出さない。
 */
function EndOfLineMessage({ errorMark }: EndOfLineMessageProps) {
  if (errorMark.kind !== "error") {
    return null;
  }
  if (errorMark.messages.length === 0) {
    return null;
  }
  return (
    <span className="model-editor__diagnostics-message">
      {errorMark.messages.join(" ")}
    </span>
  );
}

/**
 * 行番号と診断レイヤを入力欄のスクロールに合わせる。
 *
 * @param event 入力欄の scroll イベント。
 * @param gutterRef 行番号列。
 * @param diagnosticsRef 診断レイヤ。
 */
const syncEditorScroll = (
  event: UIEvent<HTMLTextAreaElement>,
  gutterRef: RefObject<HTMLDivElement | null>,
  diagnosticsRef: RefObject<HTMLDivElement | null>,
): void => {
  const { scrollTop, scrollLeft } = event.currentTarget;
  if (gutterRef.current !== null) {
    gutterRef.current.scrollTop = scrollTop;
  }
  if (diagnosticsRef.current !== null) {
    diagnosticsRef.current.scrollTop = scrollTop;
    diagnosticsRef.current.scrollLeft = scrollLeft;
  }
};
