import { Option } from "@/utils/Option";
import { DependencyCardBody } from "../card";
import { useDependencyContext } from "../context";

/**
 * 選択カードの種類・構成を確認する領域を表示する。
 * @returns インスペクターの初期領域と選択カード。
 */
export function DependencyInspector() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const selected = context.value.view.selected;

  return (
    <aside
      className="dependency-view__inspector"
      aria-label="モデルインスペクター"
    >
      <h2>モデル</h2>
      {Option.isNone(selected) ? (
        <p>モデルを選択すると種類と構成を確認できます</p>
      ) : (
        <DependencyCardBody card={selected.value} />
      )}
    </aside>
  );
}
