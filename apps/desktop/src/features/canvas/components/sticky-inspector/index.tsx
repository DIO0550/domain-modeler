import type { Sticky } from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";

type StickyInspectorProps = Readonly<{
  sticky: Sticky | undefined;
  onEdit: () => void;
}>;

/**
 * 選択中の付箋の本文と位置・サイズを表示し、本文編集へ移る。
 * @param props 選択した付箋と本文編集操作。
 * @returns 右側のプロパティパネル。
 */
export function StickyInspector({ sticky, onEdit }: StickyInspectorProps) {
  return (
    <aside className="canvas-inspector" aria-label="プロパティ">
      <h2>プロパティ</h2>
      {sticky === undefined ? (
        <p>アイテムを選択すると詳細を表示します</p>
      ) : (
        <>
          <h3>{StickyAppearance.of(sticky.type).caption}</h3>
          <p className="canvas-inspector__text">{sticky.text || "本文なし"}</p>
          <button
            type="button"
            className="canvas-history__button"
            onClick={onEdit}
          >
            本文を編集
          </button>
          <dl>
            <dt>位置</dt>
            <dd>
              {Math.round(sticky.position.x)}, {Math.round(sticky.position.y)}
            </dd>
            <dt>サイズ</dt>
            <dd>
              {Math.round(sticky.size.width)} × {Math.round(sticky.size.height)}
            </dd>
          </dl>
        </>
      )}
    </aside>
  );
}
