import { useRef, useState } from "react";

type UseDeclNameEditParams = Readonly<{
  name: string;
  onRename?: (nextName: string) => void;
}>;

/** 宣言名のインライン編集セッション。 */
export type DeclNameEdit =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "editing"; draft: string }>;

/** 宣言名のインライン編集操作。 */
export type UseDeclNameEditResult = Readonly<{
  edit: DeclNameEdit;
  start: () => void;
  changeDraft: (draft: string) => void;
  submit: (nextName: string) => void;
  cancel: () => void;
  blur: (nextName: string) => void;
}>;

/**
 * 宣言名のインライン編集セッションを返す。
 * submit の直後に blur が続いても、確定は1回だけ通知する。
 *
 * @param params 表示中の名前と確定時のリネーム通知。
 * @returns 編集状態と開始・確定・取消の操作。
 */
export function useDeclNameEdit({
  name,
  onRename,
}: UseDeclNameEditParams): UseDeclNameEditResult {
  const [edit, setEdit] = useState<DeclNameEdit>({ status: "idle" });
  const committed = useRef(false);

  const start = (): void => {
    committed.current = false;
    setEdit({ status: "editing", draft: name });
  };

  const changeDraft = (draft: string): void => {
    setEdit((current) =>
      current.status === "editing" ? { status: "editing", draft } : current,
    );
  };

  const finish = (nextName: string): void => {
    if (committed.current) {
      return;
    }
    committed.current = true;
    setEdit({ status: "idle" });
    if (onRename === undefined || nextName === name || nextName.length === 0) {
      return;
    }
    onRename(nextName);
  };

  const cancel = (): void => {
    if (committed.current) {
      return;
    }
    committed.current = true;
    setEdit({ status: "idle" });
  };

  return {
    edit,
    start,
    changeDraft,
    submit: finish,
    cancel,
    blur: finish,
  };
}
