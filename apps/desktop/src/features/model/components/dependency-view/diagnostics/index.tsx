import { Option } from "@/utils/Option";
import { useDependencyContext } from "../context";

/**
 * 現在の本文の診断を表示し、既存の定義エディタへ移動する。
 * @returns 部分構文エラー・未定義参照などの診断一覧。
 */
export function DependencyDiagnostics() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view, onEditSource } = context.value;

  if (view.diagram.diagnostics.length === 0) {
    return null;
  }

  return (
    <details className="dependency-view__diagnostics" open>
      <summary>診断 {view.diagram.diagnostics.length}件</summary>
      <ul>
        {view.diagram.diagnostics.map((diagnostic, index) => (
          <li key={index} data-severity={diagnostic.severity}>
            <button
              type="button"
              onClick={() => onEditSource(diagnostic.range)}
            >
              {diagnostic.severity === "error" ? "エラー" : "警告"}・行{" "}
              {diagnostic.range.startLine}: {diagnostic.message}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}
