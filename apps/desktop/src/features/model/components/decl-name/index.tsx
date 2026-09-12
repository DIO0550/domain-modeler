import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import "./DeclName.css";

type DeclNameProps = Readonly<{
  name: string;
  className: string;
  onRename?: (nextName: string) => void;
}>;

type NameEdit =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "editing"; draft: string }>;

/**
 * プレビューカードの宣言名。リネーム通知があるときは名前から編集できる。
 *
 * @param props 表示中の名前、見出しの class、確定時のリネーム通知。
 * @returns 宣言名の見出し。
 */
export function DeclName({ name, className, onRename }: DeclNameProps) {
  const [edit, setEdit] = useState<NameEdit>({ status: "idle" });
  const canceling = useRef(false);
  const committed = useRef(false);

  const startEditing = (): void => {
    committed.current = false;
    canceling.current = false;
    setEdit({ status: "editing", draft: name });
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const field = event.currentTarget.querySelector("input");
    if (!(field instanceof HTMLInputElement)) {
      return;
    }
    finish(field.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    canceling.current = true;
    event.currentTarget.blur();
  };

  const handleBlur = (event: FormEvent<HTMLInputElement>): void => {
    if (canceling.current) {
      canceling.current = false;
      setEdit({ status: "idle" });
      return;
    }
    finish(event.currentTarget.value);
  };

  if (edit.status === "editing") {
    return (
      <h2 className={className}>
        <form className="decl-name-form" onSubmit={handleSubmit}>
          <input
            className="decl-name-input"
            aria-label="新しい名前"
            value={edit.draft}
            autoFocus
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) =>
              setEdit({ status: "editing", draft: event.currentTarget.value })
            }
            onBlur={handleBlur}
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
        onClick={startEditing}
      >
        {name}
      </button>
    </h2>
  );
}
