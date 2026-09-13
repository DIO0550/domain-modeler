import {
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useDeclNameEdit } from "../../hooks/use-decl-name-edit";
import "./DeclName.css";

type DeclNameProps = Readonly<{
  name: string;
  className: string;
  onRename?: (nextName: string) => void;
}>;

/**
 * プレビューカードの宣言名。リネーム通知があるときは名前から編集できる。
 *
 * @param props 表示中の名前、見出しの class、確定時のリネーム通知。
 * @returns 宣言名の見出し。
 */
export function DeclName({ name, className, onRename }: DeclNameProps) {
  const nameEdit = useDeclNameEdit({ name, onRename });

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const field = event.currentTarget.querySelector("input");
    if (!(field instanceof HTMLInputElement)) {
      return;
    }
    nameEdit.submit(field.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    nameEdit.cancel();
  };

  if (nameEdit.edit.status === "editing") {
    return (
      <h2 className={className}>
        <form className="decl-name-form" onSubmit={handleSubmit}>
          <input
            className="decl-name-input"
            aria-label="新しい名前"
            value={nameEdit.edit.draft}
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => nameEdit.changeDraft(event.currentTarget.value)}
            onBlur={(event) => nameEdit.blur(event.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        </form>
      </h2>
    );
  }

  if (onRename === undefined) {
    return <h2 className={className}>{name}</h2>;
  }

  return (
    <h2 className={className}>
      <button
        type="button"
        className="decl-name-button"
        aria-label={`「${name}」をリネーム`}
        onClick={nameEdit.start}
      >
        {name}
      </button>
    </h2>
  );
}
