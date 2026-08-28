import { expect, test } from "vitest";
import { STICKY_TYPES } from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../index";

test("種別の表示名は canvas-format の表示名と一致する", () => {
  expect(StickyAppearance.of(STICKY_TYPES.event).caption).toBe("Domain Event");
  expect(StickyAppearance.of(STICKY_TYPES.command).caption).toBe("Command");
  expect(StickyAppearance.of(STICKY_TYPES.actor).caption).toBe("Actor");
  expect(StickyAppearance.of(STICKY_TYPES.aggregate).caption).toBe("Aggregate");
  expect(StickyAppearance.of(STICKY_TYPES.policy).caption).toBe("Policy");
  expect(StickyAppearance.of(STICKY_TYPES.readModel).caption).toBe("Read Model");
  expect(StickyAppearance.of(STICKY_TYPES.externalSystem).caption).toBe(
    "External System",
  );
  expect(StickyAppearance.of(STICKY_TYPES.hotspot).caption).toBe("Hotspot");
});

test("種別の色系統は canvas-ui の物理付箋の慣習と一致する", () => {
  expect(StickyAppearance.of(STICKY_TYPES.event).colorFamily).toBe("orange");
  expect(StickyAppearance.of(STICKY_TYPES.command).colorFamily).toBe("blue");
  expect(StickyAppearance.of(STICKY_TYPES.actor).colorFamily).toBe("yellow");
  expect(StickyAppearance.of(STICKY_TYPES.aggregate).colorFamily).toBe("yellow");
  expect(StickyAppearance.of(STICKY_TYPES.policy).colorFamily).toBe("purple");
  expect(StickyAppearance.of(STICKY_TYPES.readModel).colorFamily).toBe("green");
  expect(StickyAppearance.of(STICKY_TYPES.externalSystem).colorFamily).toBe(
    "pink",
  );
  expect(StickyAppearance.of(STICKY_TYPES.hotspot).colorFamily).toBe("red");
});

test("種別の標準サイズは canvas-ui のワールド座標と一致する", () => {
  expect(StickyAppearance.of(STICKY_TYPES.event).defaultSize).toEqual({
    width: 160,
    height: 100,
  });
  expect(StickyAppearance.of(STICKY_TYPES.command).defaultSize).toEqual({
    width: 160,
    height: 100,
  });
  expect(StickyAppearance.of(STICKY_TYPES.actor).defaultSize).toEqual({
    width: 120,
    height: 80,
  });
  expect(StickyAppearance.of(STICKY_TYPES.aggregate).defaultSize).toEqual({
    width: 200,
    height: 140,
  });
  expect(StickyAppearance.of(STICKY_TYPES.policy).defaultSize).toEqual({
    width: 160,
    height: 100,
  });
  expect(StickyAppearance.of(STICKY_TYPES.readModel).defaultSize).toEqual({
    width: 160,
    height: 100,
  });
  expect(StickyAppearance.of(STICKY_TYPES.externalSystem).defaultSize).toEqual({
    width: 160,
    height: 100,
  });
  expect(StickyAppearance.of(STICKY_TYPES.hotspot).defaultSize).toEqual({
    width: 140,
    height: 100,
  });
});

test("パレット順は canvas-ui の種別表の順になる", () => {
  expect(StickyAppearance.all().map((item) => item.type)).toEqual([
    STICKY_TYPES.event,
    STICKY_TYPES.command,
    STICKY_TYPES.actor,
    STICKY_TYPES.aggregate,
    STICKY_TYPES.policy,
    STICKY_TYPES.readModel,
    STICKY_TYPES.externalSystem,
    STICKY_TYPES.hotspot,
  ]);
});
