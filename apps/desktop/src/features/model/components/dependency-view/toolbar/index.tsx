import { Option } from "@/utils/Option";
import { useDependencyContext } from "../context";

/**
 * 表示範囲・倍率・フィット・再配置の閲覧操作を提供する。
 * @returns キーボードでも操作できる依存図のツールバー。
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
      <div role="group" aria-label="依存図のズーム">
        <button
          type="button"
          aria-label="縮小"
          disabled={!view.canNavigate || view.viewport.zoom <= 0.1}
          onClick={() => view.zoomBy(1 / 1.2)}
        >
          −
        </button>
        <output aria-label="倍率">
          {Math.round(view.viewport.zoom * 100)}%
        </output>
        <button
          type="button"
          aria-label="拡大"
          disabled={!view.canNavigate || view.viewport.zoom >= 4}
          onClick={() => view.zoomBy(1.2)}
        >
          ＋
        </button>
      </div>
      <button type="button" disabled={!view.canNavigate} onClick={view.fit}>
        全体に合わせる
      </button>
      <button
        type="button"
        disabled={!view.canNavigate}
        onClick={view.rearrange}
      >
        再配置
      </button>
    </div>
  );
}
