import type { Diagnostic } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { useDependencyContext } from "../context";

/**
 * 選択ノードに所属する診断と、そのソース箇所への移動を表示する。
 * @param props 選択ノードの既存診断。
 * @returns 診断がない場合も確認できる一覧。
 */
export function DependencySelectionDiagnostics({
  diagnostics,
}: Readonly<{ diagnostics: readonly Diagnostic[] }>) {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  return (
    <section aria-label="選択モデルの診断">
      <h3>診断</h3>
      {diagnostics.length === 0 ? (
        <p>なし</p>
      ) : (
        <ul className="dependency-view__references">
          {diagnostics.map((diagnostic) => (
            <li
              key={JSON.stringify([
                diagnostic.severity,
                diagnostic.message,
                diagnostic.range,
              ])}
              data-severity={diagnostic.severity}
            >
              <button
                type="button"
                onClick={() => context.value.onEditSource(diagnostic.range)}
              >
                {diagnostic.severity === "error" ? "エラー" : "警告"}・行{" "}
                {diagnostic.range.startLine}: {diagnostic.message}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
