import { Option } from "@/utils/Option";
import { useDependencyContext } from "../context";

/**
 * 選択モデルに合わせて全体と直接の関連だけの表示を切り替える。
 * @returns キーボードでも操作できる図の表示範囲切替。
 */
export function DependencyToolbar() {
  const context = useDependencyContext();

  if (Option.isNone(context)) {
    return null;
  }

  const { view } = context.value;
  const { graph } = view.visibleDiagram;
  // 対象削除で無効になってもフォーカスを失わず、続けてRedoできるようにする。
  const canShowRelated = Option.isSome(view.selected);

  return (
    <div className="dependency-view__toolbar">
      <div role="group" aria-label="依存図の表示範囲">
        <button
          type="button"
          aria-pressed={view.mode === "all"}
          onClick={() => view.setMode("all")}
        >
          全体
        </button>
        <button
          type="button"
          aria-pressed={view.mode === "related"}
          aria-disabled={!canShowRelated}
          tabIndex={canShowRelated ? 0 : -1}
          onClick={() => {
            if (!canShowRelated) {
              return;
            }

            view.setMode("related");
          }}
        >
          関連のみ
        </button>
      </div>
      <span aria-live="polite">
        {graph.nodes.length}モデル・{graph.edges.length}接続
      </span>
    </div>
  );
}
