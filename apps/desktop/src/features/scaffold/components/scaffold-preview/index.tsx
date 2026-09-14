import { useId } from "react";
import "./ScaffoldPreview.css";

type ScaffoldPreviewProps = Readonly<{
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

/**
 * 生成した全文を読み取り専用で表示し、保存へ進むか取り消すかを通知する。
 * 保存ダイアログとファイル作成は呼び出し側の確定処理が担当する。
 * @param props 生成全文と確定・キャンセルの通知先。
 * @returns 生成内容の確認画面。
 */
export function ScaffoldPreview({
  text,
  onConfirm,
  onCancel,
}: ScaffoldPreviewProps) {
  const titleId = useId();
  const descriptionId = useId();
  const textId = useId();

  return (
    <section className="scaffold-preview" aria-labelledby={titleId}>
      <header className="scaffold-preview__header">
        <h2 id={titleId}>生成内容の確認</h2>
        <p id={descriptionId}>
          このモデルは叩き台です。TODO
          と未定義の警告を確認し、保存後にモデルエディターで編集してください。
        </p>
      </header>
      <label htmlFor={textId}>生成される .dmodel（読み取り専用）</label>
      <textarea
        id={textId}
        className="scaffold-preview__text"
        aria-describedby={descriptionId}
        value={text}
        readOnly
        spellCheck={false}
        wrap="off"
      />
      <footer className="scaffold-preview__footer">
        <p>確定すると保存先を選択します。</p>
        <div className="scaffold-preview__actions">
          <button type="button" onClick={onCancel}>
            キャンセル
          </button>
          <button
            type="button"
            className="scaffold-preview__confirm"
            onClick={onConfirm}
          >
            確定
          </button>
        </div>
      </footer>
    </section>
  );
}
