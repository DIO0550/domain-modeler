import { expect, test } from "vitest";
import { ConnectionStatus } from "./connection-status";
import type { StickyType } from "./sticky";

test.each([
  { from: "actor" as const, to: "command" as const },
  { from: "command" as const, to: "aggregate" as const },
  { from: "aggregate" as const, to: "event" as const },
  { from: "event" as const, to: "policy" as const },
  { from: "policy" as const, to: "command" as const },
  { from: "event" as const, to: "readModel" as const },
  { from: "readModel" as const, to: "actor" as const },
  { from: "command" as const, to: "externalSystem" as const },
  { from: "externalSystem" as const, to: "event" as const },
])(
  "許可ペア $from -> $to は問題なしになる",
  ({ from, to }: { from: StickyType; to: StickyType }) => {
    expect(ConnectionStatus.between(from, to)).toBe("ok");
  },
);

test.each([
  { from: "actor" as const, to: "event" as const },
  { from: "actor" as const, to: "aggregate" as const },
  { from: "command" as const, to: "event" as const },
  { from: "command" as const, to: "policy" as const },
  { from: "command" as const, to: "actor" as const },
  { from: "aggregate" as const, to: "command" as const },
  { from: "aggregate" as const, to: "policy" as const },
  { from: "event" as const, to: "command" as const },
  { from: "event" as const, to: "actor" as const },
  { from: "event" as const, to: "aggregate" as const },
  { from: "policy" as const, to: "event" as const },
  { from: "policy" as const, to: "aggregate" as const },
  { from: "readModel" as const, to: "command" as const },
  { from: "readModel" as const, to: "event" as const },
  { from: "externalSystem" as const, to: "command" as const },
  { from: "externalSystem" as const, to: "actor" as const },
  { from: "actor" as const, to: "actor" as const },
  { from: "command" as const, to: "command" as const },
  { from: "event" as const, to: "event" as const },
])(
  "不許可ペア $from -> $to は警告になる",
  ({ from, to }: { from: StickyType; to: StickyType }) => {
    expect(ConnectionStatus.between(from, to)).toBe("warning");
  },
);

test.each([
  { from: "hotspot" as const, to: "actor" as const },
  { from: "hotspot" as const, to: "command" as const },
  { from: "hotspot" as const, to: "aggregate" as const },
  { from: "hotspot" as const, to: "event" as const },
  { from: "hotspot" as const, to: "policy" as const },
  { from: "hotspot" as const, to: "readModel" as const },
  { from: "hotspot" as const, to: "externalSystem" as const },
  { from: "hotspot" as const, to: "hotspot" as const },
  { from: "actor" as const, to: "hotspot" as const },
  { from: "command" as const, to: "hotspot" as const },
  { from: "aggregate" as const, to: "hotspot" as const },
  { from: "event" as const, to: "hotspot" as const },
  { from: "policy" as const, to: "hotspot" as const },
  { from: "readModel" as const, to: "hotspot" as const },
  { from: "externalSystem" as const, to: "hotspot" as const },
])(
  "hotspot ペア $from -> $to は問題なしになる",
  ({ from, to }: { from: StickyType; to: StickyType }) => {
    expect(ConnectionStatus.between(from, to)).toBe("ok");
  },
);
