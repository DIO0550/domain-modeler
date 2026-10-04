import { Result, type Result as ResultValue } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";

/** 状態の中心座標。文書内の状態行に属し、名前から独立する。 */
export type StateMachinePosition = Readonly<{ x: number; y: number }>;

const MARKER = "@canvas-position";
const ANNOTATION = /@canvas-position\(v1, ([^,]+), ([^)]+)\)$/;

export const StateMachinePosition = {
  create(point: StateMachinePosition): ResultValue<StateMachinePosition, string> {
    if (![point.x, point.y].every((value) => Number.isFinite(value) && Math.abs(value) <= 1_000_000)) {
      return Result.err("座標は-1000000から1000000までの有限数で指定してください");
    }
    return Result.ok({ x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100 });
  },
  /** 行末の予約コメントだけを読み、通常コメントはそのまま残す。 */
  read(line: string): ResultValue<Option<StateMachinePosition>, string> {
    const commentAt = line.indexOf("//");
    if (commentAt < 0 || !line.slice(commentAt).includes(MARKER)) {
      return Result.ok(Option.none());
    }
    const comment = line.slice(commentAt).trimEnd();
    const match = comment.match(ANNOTATION);
    if (match === null || comment.indexOf(MARKER) !== match.index) {
      return Result.err("配置コメントが不正です。@canvas-position(v1, x, y) をモデル定義で修正してください");
    }
    if (match[1]!.trim() === "" || match[2]!.trim() === "") {
      return Result.err("配置コメントの座標が空です");
    }
    const point = StateMachinePosition.create({ x: Number(match[1]), y: Number(match[2]) });
    if (Result.isErr(point)) {
      return point;
    }
    return Result.ok(Option.some(point.value));
  },
  write(line: string, point: StateMachinePosition): ResultValue<string, string> {
    const position = StateMachinePosition.create(point);
    if (Result.isErr(position)) {
      return position;
    }
    const current = StateMachinePosition.read(line);
    if (Result.isErr(current)) {
      return current;
    }
    const suffix = `@canvas-position(v1, ${position.value.x}, ${position.value.y})`;
    const cr = line.endsWith("\r") ? "\r" : "";
    const body = line.replace(/\r$/, "");
    if (current.value.some) {
      return Result.ok(`${body.trimEnd().replace(ANNOTATION, suffix)}${cr}`);
    }
    const separator = body.includes("//") ? " " : " // ";
    return Result.ok(`${body}${separator}${suffix}${cr}`);
  },
} as const;
