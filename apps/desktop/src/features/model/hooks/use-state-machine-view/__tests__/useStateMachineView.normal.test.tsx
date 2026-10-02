import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineViewRenderer } from "./useStateMachineView.test-support";

const views = createStateMachineViewRenderer();
afterEach(() => views.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
state-machine 返金 =
  initial: 申請
  state: 申請`;

test("マシン切替で要素選択と倍率を一緒に戻す", () => {
  const view = views.render(source);
  const firstNode = view.latest.current?.graph?.nodes[0];
  expect(firstNode).toBeDefined();
  if (firstNode === undefined) { return; }
  act(() => {
    view.latest.current?.selectElement({ kind: "node", id: firstNode.id });
    view.latest.current?.zoomBy(1.25);
  });
  expect(view.latest.current?.target.kind).toBe("element");
  expect(view.latest.current?.zoom).toBeGreaterThan(1);

  act(() => view.latest.current?.selectMachine(1));
  expect(view.latest.current?.graph?.name).toBe("返金");
  expect(view.latest.current?.target).toEqual({ kind: "none" });
  expect(view.latest.current?.zoom).toBe(1);
});

test("パレットとグラフ選択は排他的で、全文更新からグラフを再導出する", () => {
  const view = views.render(source);
  act(() => view.latest.current?.selectPart("state"));
  expect(view.latest.current?.target).toEqual({ kind: "part", part: "state" });
  const node = view.latest.current?.graph?.nodes[0];
  expect(node).toBeDefined();
  if (node === undefined) { return; }
  act(() => view.latest.current?.selectElement({ kind: "node", id: node.id }));
  expect(view.latest.current?.target).toEqual({ kind: "element", selection: { kind: "node", id: node.id } });

  view.replaceSource(source.replace("  state: 申請", "  state: 申請\n  state: 終了 terminal"));
  act(() => view.latest.current?.selectMachine(1));
  expect(view.latest.current?.graph?.nodes.map((item) => item.name)).toEqual(["申請", "終了"]);
  expect(view.latest.current?.layout?.nodes).toBeDefined();
});

test("パーツを選ぶ直前に選んでいた状態を起点として保持する", () => {
  const view = views.render(source);
  expect(view.latest.current?.origin.some).toBe(false);
  const node = view.latest.current?.graph?.nodes[0];
  expect(node).toBeDefined();
  if (node === undefined) { return; }
  act(() => view.latest.current?.selectElement({ kind: "node", id: node.id }));
  act(() => view.latest.current?.selectPart("transition"));
  expect(view.latest.current?.origin).toEqual({ some: true, value: "待機" });
  act(() => view.latest.current?.clearSelection());
  expect(view.latest.current?.origin.some).toBe(false);
  act(() => view.latest.current?.selectPart("transition"));
  expect(view.latest.current?.origin.some).toBe(false);
});

test("線を引いた遷移元・遷移先で遷移の追加を開き、パーツの選び直しで遷移先を外す", () => {
  const view = views.render(source);
  act(() => view.latest.current?.drawTransition("待機", "待機"));
  expect(view.latest.current?.target).toEqual({ kind: "part", part: "transition" });
  expect(view.latest.current?.origin).toEqual({ some: true, value: "待機" });
  expect(view.latest.current?.destination).toEqual({ some: true, value: "待機" });
  act(() => view.latest.current?.selectPart("transition"));
  expect(view.latest.current?.destination.some).toBe(false);
});

test("基準点を動かさずに拡大縮小し、パンとフィット・マシン切替で表示位置を扱う", () => {
  const view = views.render(source);
  act(() => view.latest.current?.zoomBy(2, { x: 100, y: 40 }));
  expect(view.latest.current?.zoom).toBe(2);
  expect(view.latest.current?.pan).toEqual({ x: 50, y: 20 });
  act(() => view.latest.current?.zoomBy(10, { x: 100, y: 40 }));
  expect(view.latest.current?.zoom).toBe(3);
  expect(view.latest.current?.pan.x).toBeCloseTo(100 - 50 * 2 / 3);
  act(() => view.latest.current?.zoomBy(0.5));
  expect(view.latest.current?.pan.x).toBeCloseTo(100 - 50 * 2 / 3);
  act(() => view.latest.current?.panBy({ x: 5, y: -5 }));
  expect(view.latest.current?.pan.y).toBeCloseTo(40 - 20 * 2 / 3 - 5);
  act(() => view.latest.current?.fit());
  expect(view.latest.current?.zoom).toBe(1);
  expect(view.latest.current?.pan).toEqual({ x: 0, y: 0 });
  act(() => view.latest.current?.panBy({ x: 30, y: 0 }));
  act(() => view.latest.current?.selectMachine(1));
  expect(view.latest.current?.pan).toEqual({ x: 0, y: 0 });
});
