import type { Sticky } from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";

type StickyInspectorProps = Readonly<{
  sticky: Sticky | undefined;
  onEditStart: () => void;
  onChange: (text: string) => void;
  onCommit: () => void;
}>;

/**
 * 選択した付箋の本文を直接編集し、種別と寸法を表示する。
 * @param props 選択付箋と本文編集セッションの操作。
 * @returns 常時表示するプロパティパネル。
 */
export function StickyInspector({
  sticky,
  onEditStart,
  onChange,
  onCommit,
}: StickyInspectorProps) {
  return (
    <aside className="canvas-inspector" aria-label="プロパティ">
      <h2>プロパティ</h2>
      {sticky === undefined ? (
        <div className="canvas-inspector__empty">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <rect x="4" y="4" width="16" height="16" rx="3" />
            <path d="M8 9h8M8 13h5" />
          </svg>
          <p>付箋を選択して編集</p>
        </div>
      ) : (
        <>
          <div className="canvas-inspector__type">
            <span
              className="canvas-palette__swatch"
              data-sticky-type={sticky.type}
            />
            <span>{StickyAppearance.of(sticky.type).caption}</span>
          </div>
          <label className="canvas-inspector__field">
            <span>本文</span>
            <textarea
              key={sticky.id}
              aria-label="プロパティの本文"
              value={sticky.text}
              placeholder="本文を入力"
              onFocus={onEditStart}
              onChange={(event) => onChange(event.target.value)}
              onBlur={onCommit}
            />
          </label>
          <section
            className="canvas-inspector__geometry"
            aria-label="レイアウト"
          >
            <h3>レイアウト</h3>
            <dl>
              <div>
                <dt>X</dt>
                <dd>{Math.round(sticky.position.x)}</dd>
              </div>
              <div>
                <dt>Y</dt>
                <dd>{Math.round(sticky.position.y)}</dd>
              </div>
              <div>
                <dt>W</dt>
                <dd>{Math.round(sticky.size.width)}</dd>
              </div>
              <div>
                <dt>H</dt>
                <dd>{Math.round(sticky.size.height)}</dd>
              </div>
            </dl>
          </section>
        </>
      )}
    </aside>
  );
}
