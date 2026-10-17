import { expect, test } from "vitest";
import { Viewport } from "@domain-modeler/canvas-core";
import { Option } from "@/utils/Option";
import { DependencyNavigation } from "..";
import {
  navigationFixture,
  relatedNavigation,
} from "./dependencyNavigation.test-support";

test("初回表示では全カードと接続経路を表示領域へ収める", () => {
  const { navigation, layout } = navigationFixture();
  const viewport = DependencyNavigation.viewport(navigation);
  const corners = layout.nodes.flatMap((node) => [
    node,
    { x: node.x + node.width, y: node.y + node.height },
  ]);
  const points = [...corners, ...layout.edges.flatMap((edge) => edge.points)];

  expect(
    points.every((point) => {
      const screen = Viewport.worldToScreen(viewport, point);

      return (
        screen.x >= 0 && screen.y >= 0 && screen.x <= 800 && screen.y <= 500
      );
    }),
  ).toBe(true);
});

test("ポインターを基準に拡大してもその位置のモデル座標が変わらない", () => {
  const { navigation } = navigationFixture();
  const anchor = { x: 123, y: 345 };
  const before = Viewport.screenToWorld(
    DependencyNavigation.viewport(navigation),
    anchor,
  );
  const zoomed = DependencyNavigation.reduce(navigation, {
    type: "zoom",
    factor: 2,
    anchor: Option.some(anchor),
  });
  const after = Viewport.screenToWorld(
    DependencyNavigation.viewport(zoomed),
    anchor,
  );

  expect(after.x).toBeCloseTo(before.x);
  expect(after.y).toBeCloseTo(before.y);
});

test("画面上のドラッグ距離は拡大率によらず同じパン距離になる", () => {
  const { navigation } = navigationFixture();
  const zoomed = DependencyNavigation.reduce(navigation, {
    type: "zoom",
    factor: 2,
    anchor: Option.none(),
  });
  const panned = DependencyNavigation.reduce(zoomed, {
    type: "pan",
    delta: { x: 80, y: -50 },
  });
  const before = Viewport.worldToScreen(DependencyNavigation.viewport(zoomed), {
    x: 100,
    y: 200,
  });
  const after = Viewport.worldToScreen(DependencyNavigation.viewport(panned), {
    x: 100,
    y: 200,
  });

  expect(after.x - before.x).toBeCloseTo(80);
  expect(after.y - before.y).toBeCloseTo(-50);
});

test("関連のみへフィットした後に全体へ戻すと元のパンと倍率を復元する", () => {
  const { navigation, diagram } = navigationFixture();
  const panned = DependencyNavigation.reduce(navigation, {
    type: "pan",
    delta: { x: 200, y: 100 },
  });
  const related = relatedNavigation(panned, diagram.cards[2].id);
  const fitted = DependencyNavigation.reduce(related, { type: "fit" });
  const restored = DependencyNavigation.reduce(fitted, {
    type: "selection",
    action: { type: "set-mode", mode: "all" },
  });

  expect(DependencyNavigation.viewport(related)).not.toEqual(
    DependencyNavigation.viewport(panned),
  );
  expect(DependencyNavigation.viewport(restored)).toEqual(
    DependencyNavigation.viewport(panned),
  );
  expect(restored.selection.target.mode).toBe("all");
});

test("関連のみ表示で選択先を変えるとその直接近傍へフィットする", () => {
  const { navigation, diagram, frame } = navigationFixture();
  const related = relatedNavigation(navigation, diagram.cards[0].id);
  const next = DependencyNavigation.reduce(related, {
    type: "selection",
    action: { type: "select", id: diagram.cards[2].id },
  });

  expect(DependencyNavigation.viewport(next)).toEqual(
    DependencyNavigation.fitViewport(next.selection, Option.unwrap(frame)),
  );
  expect(DependencyNavigation.viewport(next)).not.toEqual(
    DependencyNavigation.viewport(related),
  );
});

test("本文・寸法の更新では未選択のパンと倍率を維持する", () => {
  const { navigation, diagram } = navigationFixture();
  const panned = DependencyNavigation.reduce(navigation, {
    type: "pan",
    delta: { x: -900, y: 700 },
  });
  const updated = navigationFixture(
    "data A = B\ndata B = string\ndata C = int\ndata D = bool\n",
  );
  const next = DependencyNavigation.synchronize(panned, {
    diagram: updated.diagram,
    frame: updated.frame,
  });

  expect(DependencyNavigation.viewport(next)).toEqual(
    DependencyNavigation.viewport(panned),
  );
  expect(diagram.source).toBe(navigation.selection.diagram.source);
});

test("再配置は新しい全文書の配置が届いてから現在の関連へフィットする", () => {
  const { navigation, diagram, frame, layout } = navigationFixture();
  const related = relatedNavigation(navigation, diagram.cards[0].id);
  const requested = DependencyNavigation.reduce(related, { type: "rearrange" });
  const movedLayout = {
    ...layout,
    nodes: layout.nodes.map((node) => ({ ...node, x: node.x + 1000 })),
  };
  const newFrame = {
    ...Option.unwrap(frame),
    layout: movedLayout,
    attempt: requested.attempt,
  };
  const next = DependencyNavigation.synchronize(requested, {
    diagram,
    frame: Option.some(newFrame),
  });

  expect(DependencyNavigation.viewport(requested)).toEqual(
    DependencyNavigation.viewport(related),
  );
  expect(DependencyNavigation.viewport(next)).toEqual(
    DependencyNavigation.fitViewport(next.selection, newFrame),
  );
});
