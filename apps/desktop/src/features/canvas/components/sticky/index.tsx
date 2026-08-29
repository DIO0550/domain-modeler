import { useEffect, useRef, type CSSProperties } from "react";
import type { Sticky as StickyModel } from "@domain-modeler/canvas-core";
import {
  StickyAppearance,
  type StickyRotation,
} from "../../domains/sticky-appearance";

/** 付箋の選択枠と本文の表示/編集。 */
export type StickyChrome =
  | Readonly<{ status: "plain" }>
  | Readonly<{ status: "selected" }>
  | Readonly<{
      status: "editing";
      draftText: string;
      onDraftChange: (text: string) => void;
      onCommit: () => void;
    }>;

type StickyProps = Readonly<{
  sticky: StickyModel;
  chrome?: StickyChrome;
}>;

type StickyStyle = CSSProperties & {
  readonly "--sticky-body-line-count": number;
};

/**
 * キャンバス上の付箋。種別色・標準またはファイルのサイズ・本文を表示する。
 *
 * @param props 描画する付箋と、選択または編集の表示。
 * @returns 付箋。
 */
export function Sticky({
  sticky,
  chrome = { status: "plain" },
}: StickyProps) {
  const articleRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const appearance = StickyAppearance.of(sticky.type);
  const lineCount = StickyAppearance.bodyLineCount(sticky.size);
  const displayedText =
    chrome.status === "editing" ? chrome.draftText : sticky.text;
  const accessibleName = stickyAccessibleName(appearance.caption, displayedText);
  const stickyStyle: StickyStyle = {
    left: `${sticky.position.x}px`,
    top: `${sticky.position.y}px`,
    width: `${sticky.size.width}px`,
    height: `${sticky.size.height}px`,
    "--sticky-body-line-count": lineCount,
  };

  useEffect(() => {
    if (chrome.status === "selected") {
      articleRef.current?.focus();
      return;
    }
    if (chrome.status === "editing") {
      editorRef.current?.focus();
    }
  }, [chrome.status, sticky.id]);

  return (
    <article
      ref={articleRef}
      className={stickyClassName(chrome.status)}
      data-sticky-type={sticky.type}
      data-sticky-id={sticky.id}
      data-sticky-session={chrome.status}
      aria-label={accessibleName}
      tabIndex={chrome.status === "plain" ? undefined : 0}
      style={stickyStyle}
    >
      <div className={stickyFaceClassName(appearance.rotation)}>
        <span className="sticky__caption">{appearance.caption}</span>
        <div className="sticky__body">
          {chrome.status === "editing" ? (
            <textarea
              ref={editorRef}
              className="sticky__editor"
              aria-label={`${appearance.caption}の本文`}
              value={chrome.draftText}
              onChange={(event) => {
                chrome.onDraftChange(event.target.value);
              }}
              onBlur={chrome.onCommit}
            />
          ) : (
            <p className="sticky__text">{sticky.text}</p>
          )}
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
 * 付箋の外枠 class を組み立てる。
 *
 * @param status 選択や編集の状態。
 * @returns sticky と選択修飾。
 */
const stickyClassName = (status: StickyChrome["status"]): string => {
  const selectedClass = status === "plain" ? [] : ["sticky--selected"];
  const classNames = ["sticky", ...selectedClass];
  return classNames.join(" ");
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
