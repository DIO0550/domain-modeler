import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DependencyNavigation } from "..";
import {
  navigationFixture,
  relatedNavigation,
} from "./dependencyNavigation.test-support";

test.each([
  { factor: 1e9, zoom: 4 },
  { factor: 1e-9, zoom: 0.1 },
])("ズームは10〜400%の範囲に制限する: $zoom", ({ factor, zoom }) => {
  const { navigation } = navigationFixture();
  const next = DependencyNavigation.reduce(navigation, {
    type: "zoom",
    factor,
    anchor: Option.none(),
  });

  expect(DependencyNavigation.viewport(next).zoom).toBe(zoom);
});

test("配置のない状態ではパン・ズーム・フィットを行わない", () => {
  const { diagram } = navigationFixture();
  const initial = DependencyNavigation.create(diagram);
  const panned = DependencyNavigation.reduce(initial, {
    type: "pan",
    delta: { x: 10, y: 20 },
  });
  const zoomed = DependencyNavigation.reduce(panned, {
    type: "zoom",
    factor: 2,
    anchor: Option.none(),
  });
  const fitted = DependencyNavigation.reduce(zoomed, { type: "fit" });

  expect(fitted).toEqual(initial);
});

test("関連表示の選択が削除されると計測前でも全体の表示位置へ戻す", () => {
  const { navigation, diagram } = navigationFixture();
  const panned = DependencyNavigation.reduce(navigation, {
    type: "pan",
    delta: { x: 70, y: 80 },
  });
  const related = relatedNavigation(panned, diagram.cards[0].id);
  const updated = navigationFixture("data B = string\n");
  const next = DependencyNavigation.synchronize(related, {
    diagram: updated.diagram,
    frame: Option.none(),
  });

  expect(next.selection.target.mode).toBe("all");
  expect(DependencyNavigation.viewport(next)).toEqual(
    DependencyNavigation.viewport(panned),
  );
});

test("存在しないモデルへ移動しても選択と表示位置を変えない", () => {
  const { navigation } = navigationFixture();

  expect(
    DependencyNavigation.reduce(navigation, { type: "reveal", id: "missing" }),
  ).toEqual(navigation);
});

test("空文書へのフィットでも有限の表示位置を返す", () => {
  const { navigation } = navigationFixture("");

  expect(DependencyNavigation.viewport(navigation)).toEqual({
    x: 0,
    y: 0,
    zoom: 1,
  });
});
