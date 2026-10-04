import { Option } from "@/utils/Option";
import type { StateMachinePosition } from "../state-machine-position";

/** クリックとドラッグを画面上の距離で区別する、1本のポインター操作。 */
export type StateMachineGesture = Readonly<{
  source: string;
  pointerId: number;
  start: StateMachinePosition;
  current: StateMachinePosition;
  origin: StateMachinePosition;
  scale: StateMachinePosition;
  moved: boolean;
  target: Readonly<{ kind: "canvas" }> | Readonly<{ kind: "node"; name: string }> | Readonly<{ kind: "edge"; id: string }> | Readonly<{ kind: "connection"; name: string; anchor: StateMachinePosition }>;
}>;

export const StateMachineGesture = {
  nodePosition(gesture: Option<StateMachineGesture>, source: string): Option<Readonly<{ name: string; point: StateMachinePosition }>> {
    if (!gesture.some) {
      return Option.none();
    }
    const current = gesture.value;
    if (current.source !== source || !current.moved || current.target.kind !== "node") {
      return Option.none();
    }
    return Option.some({ name: current.target.name, point: StateMachineGesture.position(current) });
  },
  move(gesture: StateMachineGesture, current: StateMachinePosition): StateMachineGesture {
    return { ...gesture, current, moved: gesture.moved || Math.hypot(current.x - gesture.start.x, current.y - gesture.start.y) >= 4 };
  },
  position(gesture: StateMachineGesture): StateMachinePosition {
    return {
      x: gesture.origin.x + (gesture.current.x - gesture.start.x) * gesture.scale.x,
      y: gesture.origin.y + (gesture.current.y - gesture.start.y) * gesture.scale.y,
    };
  },
} as const;
