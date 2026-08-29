import type { CSSProperties } from "react";
import type { Sticky as StickyModel } from "@domain-modeler/canvas-core";
import {
  StickyAppearance,
  type StickyRotation,
} from "../../domains/sticky-appearance";

type StickyProps = Readonly<{
  sticky: StickyModel;
}>;

type StickyStyle = CSSProperties & {
  readonly "--sticky-body-line-count": number;
};

/**
 * キャンバス上の付箋。種別色・標準またはファイルのサイズ・本文を表示する。
 *
 * @param props 描画する付箋。
 * @returns 付箋。
 */
export function Sticky({ sticky }: StickyProps) {
  const appearance = StickyAppearance.of(sticky.type);
  const lineCount = StickyAppearance.bodyLineCount(sticky.size);
  const accessibleName = stickyAccessibleName(appearance.caption, sticky.text);
  const stickyStyle: StickyStyle = {
    left: `${sticky.position.x}px`,
    top: `${sticky.position.y}px`,
    width: `${sticky.size.width}px`,
    height: `${sticky.size.height}px`,
    "--sticky-body-line-count": lineCount,
  };

  return (
    <article
      className="sticky"
      data-sticky-type={sticky.type}
      data-sticky-id={sticky.id}
      aria-label={accessibleName}
      style={stickyStyle}
    >
      <div className={stickyFaceClassName(appearance.rotation)}>
        <span className="sticky__caption">{appearance.caption}</span>
        <div className="sticky__body">
          <p className="sticky__text">{sticky.text}</p>
        </div>
      </div>
    </article>
  );
}

/**
 * 付箋の読み上げ名を組み立てる。
 *
 * @param caption 種別名。
 * @param text 本文。空なら種別名だけにする。
 * @returns 種別と本文を含む名前。
 */
const stickyAccessibleName = (caption: string, text: string): string => {
  if (text.length === 0) {
    return caption;
  }
  return `${caption}: ${text}`;
};

/**
 * 付箋の紙面 class を組み立てる。
 *
 * @param rotation 直立か僅かに傾けるか。
 * @returns sticky__face と傾き修飾。
 */
const stickyFaceClassName = (rotation: StickyRotation): string => {
  const tiltedClass = rotation === "tilted" ? ["sticky__face--tilted"] : [];
  const classNames = ["sticky__face", ...tiltedClass];
  return classNames.join(" ");
};
