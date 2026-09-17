import { useEffect, useEffectEvent, useRef, type PointerEvent } from "react";
import { ANCHORS, type Anchor, type Point } from "@domain-modeler/canvas-core";

type ConnectionHandlesProps = Readonly<{
  onStart: (anchor: Anchor) => void;
  onMove: (point: Point) => void;
  onFinish: (point: Point) => void;
  onCancel: () => void;
}>;

const anchorLabels: Readonly<Record<Anchor, string>> = {
  top: "上",
  right: "右",
  bottom: "下",
  left: "左",
};

/**
 * 四辺の中央に接続ハンドルを表示し、捕捉したポインターの操作を通知する。
 * @param props 接続ドラッグの開始、移動、確定、取消操作。
 * @returns 四辺の接続ハンドル。
 */
export function ConnectionHandles({
  onStart,
  onMove,
  onFinish,
  onCancel,
}: ConnectionHandlesProps) {
  const pointerId = useRef<number | null>(null);
  const cancel = (): void => {
    if (pointerId.current === null) {
      return;
    }
    pointerId.current = null;
    onCancel();
  };
  const cancelOnHide = useEffectEvent(cancel);
  useEffect(() => () => cancelOnHide(), []);
  const cancelPointer = (event: PointerEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    if (pointerId.current === event.pointerId) {
      cancel();
    }
  };
  return Object.values(ANCHORS).map((anchor) => (
    <button
      key={anchor}
      type="button"
      className="sticky__connection-handle"
      data-connection-anchor={anchor}
      aria-label={`${anchorLabels[anchor]}辺から接続`}
      title={`${anchorLabels[anchor]}辺からドラッグして接続`}
      onPointerDown={(event) => {
        event.stopPropagation();
        if (
          event.button !== 0 ||
          !event.isPrimary ||
          pointerId.current !== null
        ) {
          return;
        }
        event.preventDefault();
        event.currentTarget.focus();
        pointerId.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart(anchor);
      }}
      onPointerMove={(event) => {
        event.stopPropagation();
        if (pointerId.current !== event.pointerId) {
          return;
        }
        onMove({ x: event.clientX, y: event.clientY });
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        if (pointerId.current !== event.pointerId) {
          return;
        }
        pointerId.current = null;
        onFinish({ x: event.clientX, y: event.clientY });
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={cancelPointer}
      onLostPointerCapture={cancelPointer}
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    />
  ));
}
