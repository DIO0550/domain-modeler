import { Option } from "@/utils/Option";
import { useDependencyContext } from "..";

/** Contextの共有と不在を、利用者から見える選択表示で確認する。 */
export function ContextReadout() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return <output>未接続</output>;
  }

  const view = context.value.view;
  const name = Option.isSome(view.selected)
    ? view.selected.value.name
    : "未選択";

  return (
    <>
      <output>{name}</output>
      <button
        type="button"
        onClick={() => view.select(view.diagram.cards[0].id)}
      >
        選択
      </button>
    </>
  );
}
