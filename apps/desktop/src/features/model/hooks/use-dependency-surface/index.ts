import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
} from "react";
import type { Point } from "@domain-modeler/canvas-core";
import { DiagramSurface } from "@/libs/diagram-surface";
import { EventTargetEx } from "@/utils/EventTargetEx";
import { WheelEventEx } from "@/utils/WheelEventEx";
import { Option } from "@/utils/Option";
import { DependencyPan } from "../../domains/dependency-pan";

type UseDependencySurfaceParams = Readonly<{
  observeSurface: typeof DiagramSurface.observe;
  panBy: (delta: Point) => void;
  zoomBy: (factor: number, anchor: Point) => void;
  isVisible?: boolean;
}>;

/**
 * 図の表示寸法と、空白ドラッグ・wheel操作を仲介する。
 * @param params 表示位置の更新操作。
 * @returns 図のref・寸法・パン状態とポインターハンドラー。
 */
export function useDependencySurface({
  panBy,
  zoomBy,
  observeSurface,
  isVisible = true,
}: UseDependencySurfaceParams) {
  const surfaceRef = useRef<HTMLElement>(null);
  const [size, setSize] = useState<
    Option<Readonly<{ width: number; height: number }>>
  >(Option.none());
  const [isPanning, setIsPanning] = useState(false);
  const pointer = useRef<DependencyPan>(DependencyPan.create());
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;

    if (!isVisible || surface === null) {
      return;
    }

    return observeSurface(surface, (next) => setSize(Option.some(next)));
  }, [observeSurface, isVisible]);

  useEffect(() => {
    const surface = surfaceRef.current;

    if (!isVisible || surface === null) {
      return;
    }

    const stop = DiagramSurface.listenWheel(surface, (event) => {
      event.preventDefault();

      if (pointer.current.phase !== "idle") {
        return;
      }

      const delta = WheelEventEx.toPixelDelta(event, surface);

      if (event.ctrlKey || event.metaKey) {
        zoomBy(
          Math.exp(-delta.y * 0.002),
          DiagramSurface.point(surface, { x: event.clientX, y: event.clientY }),
        );

        return;
      }

      panBy({ x: -delta.x, y: -delta.y });
    });

    return () => {
      stop();

      const current = pointer.current;

      pointer.current = DependencyPan.create();
      suppressClick.current = false;
      setIsPanning(false);

      if (current.phase !== "idle") {
        DiagramSurface.release(surface, current.pointerId);
      }
    };
  }, [panBy, zoomBy, isVisible]);

  const finish = (event: PointerEvent<HTMLElement>) => {
    const current = pointer.current;

    if (current.phase === "idle" || current.pointerId !== event.pointerId) {
      return;
    }

    pointer.current = DependencyPan.create();

    if (event.type !== "pointerup") {
      suppressClick.current = false;
    }

    setIsPanning(false);
    DiagramSurface.release(event.currentTarget, event.pointerId);
  };

  return {
    surfaceRef,
    size,
    isPanning,
    handlers: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (pointer.current.phase !== "idle") {
          return;
        }

        // 取消後などに互換clickが届かなくても、次の操作を抑止しない。
        suppressClick.current = false;

        if (
          event.button !== 0 ||
          !event.isPrimary ||
          EventTargetEx.isInteractive(event.target)
        ) {
          return;
        }

        pointer.current = DependencyPan.start(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        DiagramSurface.capture(event.currentTarget, event.pointerId);
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (
          pointer.current.phase === "idle" ||
          pointer.current.pointerId !== event.pointerId
        ) {
          return;
        }

        const next = DependencyPan.move(pointer.current, {
          pointerId: event.pointerId,
          point: { x: event.clientX, y: event.clientY },
        });

        pointer.current = next.pan;

        if (next.pan.phase !== "panning") {
          return;
        }

        suppressClick.current = true;
        setIsPanning(true);
        panBy(next.delta);
      },
      onPointerUp: finish,
      onPointerCancel: finish,
      onLostPointerCapture: finish,
      onClickCapture: (event: MouseEvent<HTMLElement>) => {
        if (!suppressClick.current) {
          return;
        }

        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      },
    },
  };
}
