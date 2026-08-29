import { useEffect, useRef, type CSSProperties, type FocusEvent } from "react";
import type { Sticky as StickyModel } from "@domain-modeler/canvas-core";
import {
  StickyAppearance,
  type StickyRotation,
} from "../../domains/sticky-appearance";
import type { StickyChromeView } from "../../domains/sticky-interaction";

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

type DraftHandlers = Readonly<{
  onDraftChange: (text: string) => void;
  onCommit: () => void;
}>;

/** `StickyChrome` を生成する関数群。 */
export const StickyChrome = {
  /**
   * 表示状態に本文操作を付けて、付箋の chrome にする。
   *
   * @param view 選択枠または本文編集の表示。
   * @param handlers 本文の下書き更新と確定。
   * @returns 付箋の chrome。
   */
  of(view: StickyChromeView, handlers: DraftHandlers): StickyChrome {
    if (view.status !== "editing") {
      return view;
    }
    return {
      status: "editing",
      draftText: view.draftText,
      onDraftChange: handlers.onDraftChange,
      onCommit: handlers.onCommit,
    };
  },
} as const;

type StickyProps = Readonly<{
  sticky: StickyModel;
  chrome?: StickyChrome;
  onActivate?: () => void;
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
  onActivate,
}: StickyProps) {
  const articleRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previousChromeStatusRef = useRef(chrome.status);
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
    const previousStatus = previousChromeStatusRef.current;
    previousChromeStatusRef.current = chrome.status;
    if (chrome.status === "editing") {
      editorRef.current?.focus();
      return;
    }
    if (chrome.status !== "selected") {
      return;
    }
    if (previousStatus === "editing") {
      return;
    }
    articleRef.current?.focus();
  }, [chrome.status, sticky.id]);

  return (
    <article
      ref={articleRef}
      className={stickyClassName(chrome.status)}
      data-sticky-type={sticky.type}
      data-sticky-id={sticky.id}
      data-sticky-session={chrome.status}
      aria-label={accessibleName}
      tabIndex={0}
      style={stickyStyle}
      onFocus={(event) => {
        activateStickyFromFocus(event, onActivate);
      }}
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
              onClick={(event) => {
                event.stopPropagation();
              }}
              onDoubleClick={(event) => {
                event.stopPropagation();
              }}
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
 * 付箋本体へフォーカスしたときだけ選択を始める。textarea へのフォーカスは対象外。
 *
 * @param event 付箋のフォーカスイベント。
 * @param onActivate 付箋を選択する操作。
 */
const activateStickyFromFocus = (
  event: FocusEvent<HTMLElement>,
  onActivate: (() => void) | undefined,
): void => {
  if (onActivate === undefined) {
    return;
  }
  if (event.target !== event.currentTarget) {
    return;
  }
  onActivate();
};

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
