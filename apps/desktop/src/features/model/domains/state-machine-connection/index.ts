import type { StateMachineResolution } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import type { StateMachineGraph } from "../state-machine-graph";
import { StateMachineLayout } from "../state-machine-layout";
import { StateMachineGesture } from "../state-machine-gesture";
import { StateMachinePlacement } from "../state-machine-placement";
import type { StateMachinePosition } from "../state-machine-position";

export type StateMachineConnection = Readonly<{
  from: string;
  start: StateMachinePosition;
  end: StateMachinePosition;
}> & (Readonly<{ kind: "pending" }> | Readonly<{ kind: "connected"; to: string }>);

export const StateMachineConnection = {
  preview(context: Readonly<{ graph: StateMachineGraph; layout: StateMachineLayout; resolution: StateMachineResolution }>,
    gesture: StateMachineGesture): Option<StateMachineConnection> {
    if (gesture.target.kind !== "connection") {
      return Option.none();
    }
    const point = StateMachineGesture.position(gesture);
    const candidate = StateMachineConnection.candidate(context, point);
    const origin = { from: gesture.target.name, start: gesture.target.anchor };
    if (!candidate.some) {
      return Option.some({ ...origin, kind: "pending", end: point });
    }
    return Option.some({ ...origin, kind: "connected", to: candidate.value.name, end: candidate.value.point });
  },
  canStart(resolution: StateMachineResolution, name: string): boolean {
    if (!StateMachinePlacement.isMovable(resolution, name)) {
      return false;
    }
    return !resolution.machine.states.some((state) => state.name === name && state.terminal);
  },
  handles(point: StateMachinePosition): Readonly<Record<"top" | "right" | "bottom" | "left", StateMachinePosition>> {
    const { width, height } = StateMachineLayout.nodeSize;
    return {
      top: { x: point.x, y: point.y - height / 2 },
      right: { x: point.x + width / 2, y: point.y },
      bottom: { x: point.x, y: point.y + height / 2 },
      left: { x: point.x - width / 2, y: point.y },
    };
  },
  /** 描画順の最前面から実在する一意な状態だけを探す。強調と確定で同じ判定を使う。 */
  candidate(context: Readonly<{ graph: StateMachineGraph; layout: StateMachineLayout; resolution: StateMachineResolution }>,
    point: StateMachinePosition): Option<Readonly<{ name: string; point: StateMachinePosition }>> {
    const { width, height } = StateMachineLayout.nodeSize;
    const node = [...context.graph.nodes].reverse().find((item) => {
      const center = context.layout.nodes[item.id];
      if (center === undefined || !StateMachinePlacement.isMovable(context.resolution, item.name)) {
        return false;
      }
      return Math.abs(point.x - center.x) <= width / 2 && Math.abs(point.y - center.y) <= height / 2;
    });
    if (node === undefined) {
      return Option.none();
    }
    const center = context.layout.nodes[node.id]!;
    const nearest = Object.values(StateMachineConnection.handles(center)).reduce((best, handle) =>
      Math.hypot(point.x - handle.x, point.y - handle.y) < Math.hypot(point.x - best.x, point.y - best.y) ? handle : best);
    return Option.some({ name: node.name, point: nearest });
  },
  path(connection: StateMachineConnection): string {
    const { start, end } = connection;
    if (connection.kind === "connected" && connection.from === connection.to) {
      return `M ${start.x} ${start.y} C ${start.x + 100} ${start.y - 100}, ${end.x - 100} ${end.y - 100}, ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  },
  label(connection: StateMachineConnection, viewport: Pick<StateMachineLayout, "left" | "top" | "width" | "height">): StateMachinePosition {
    const x = (connection.start.x + connection.end.x) / 2;
    const y = (connection.start.y + connection.end.y) / 2 - (connection.kind === "connected" && connection.from === connection.to ? 85 : 16);
    // 入力欄(260×200)を表示範囲内に収め、端の状態でも確定・取消に到達できるようにする。
    return { x: Math.max(viewport.left + 140, Math.min(viewport.left + viewport.width - 140, x)),
      y: Math.max(viewport.top + 48, Math.min(viewport.top + viewport.height - 172, y)) };
  },
} as const;
