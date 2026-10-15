import { Option } from "@/utils/Option";
import { DependencyCardBody } from "../card";
import { useDependencyContext } from "../context";
import { DependencyReferences } from "../references";
import { DependencySelectionDiagnostics } from "../selection-diagnostics";

/**
 * 選択モデルの定義・両方向の参照関係・診断と移動操作を表示する。
 * @returns 選択内容のインスペクター。Rootの外では表示しない。
 */
export function DependencyInspector() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view, onEditSource } = context.value;
  const { inspection } = view;

  return (
    <aside
      className="dependency-view__inspector"
      aria-label="モデルインスペクター"
    >
      <h2>モデル</h2>
      {Option.isNone(inspection) ? (
        <p>モデルを選択すると定義と参照関係を確認できます</p>
      ) : (
        <>
          <DependencyCardBody card={inspection.value.card} />
          <DependencyReferences
            title="依存先"
            relations={inspection.value.dependencies}
          />
          <DependencyReferences
            title="参照元"
            relations={inspection.value.referrers}
          />
          <section aria-label="選択モデルの定義">
            <h3>定義</h3>
            {Option.isNone(inspection.value.definition) ? (
              <p>定義がありません</p>
            ) : (
              <>
                <pre>{inspection.value.definition.value.text}</pre>
                <button
                  type="button"
                  onClick={() => {
                    const definition = inspection.value.definition;

                    if (Option.isSome(definition)) {
                      onEditSource(definition.value.range);
                    }
                  }}
                >
                  定義を編集
                </button>
              </>
            )}
          </section>
          <DependencySelectionDiagnostics
            diagnostics={inspection.value.node.diagnostics}
          />
        </>
      )}
    </aside>
  );
}
