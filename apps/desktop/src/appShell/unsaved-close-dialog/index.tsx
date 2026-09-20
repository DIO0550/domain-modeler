import { useEffect, useRef } from "react";

/**
 * 未保存文書を閉じる選択を、フォーカスを制限したモーダルで受け取る。
 * @param props 文書名と選択後の操作。
 * @returns 保存・破棄・取消の確認ダイアログ。
 */
export function UnsavedCloseDialog({
  name,
  onChoose,
}: Readonly<{
  name: string;
  onChoose: (choice: "save" | "discard" | "cancel") => void;
}>) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-label="未保存の文書を閉じる"
      className="unsaved-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onChoose("cancel");
      }}
    >
      <h2>変更を保存しますか？</h2>
      <p>{name} の内容は、保存しないと失われます。</p>
      <div className="unsaved-dialog__actions">
        <button type="button" onClick={() => onChoose("discard")}>
          保存せずに閉じる
        </button>
        <button type="button" autoFocus onClick={() => onChoose("cancel")}>
          キャンセル
        </button>
        <button type="button" onClick={() => onChoose("save")}>
          保存して閉じる
        </button>
      </div>
    </dialog>
  );
}
