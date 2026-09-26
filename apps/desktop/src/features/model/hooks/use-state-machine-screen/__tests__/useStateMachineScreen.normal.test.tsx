import { act } from "react";
import { afterEach, expect, test } from "vitest";
import { createStateMachineScreenRenderer } from "./useStateMachineScreen.test-support";

const screens = createStateMachineScreenRenderer();
afterEach(() => screens.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
state-machine 返金 =
  initial: 申請
  state: 申請`;

test("マシンを切り替えると要素選択と倍率をまとめて解除する", () => {
  const screen = screens.render(source);
  const firstNode = screen.latest.current?.graph?.nodes[0];
  expect(firstNode).toBeDefined();
  expect(screen.latest.current?.layout?.nodes).toBeDefined();
  if (firstNode === undefined) { return; }

  act(() => {
    screen.latest.current?.selectElement({ kind: "node", id: firstNode.id });
    screen.latest.current?.zoomBy(1.25);
  });
  expect(screen.latest.current?.target).toEqual({ kind: "element", selection: { kind: "node", id: firstNode.id } });
  expect(screen.latest.current?.zoom).toBeGreaterThan(1);

  act(() => screen.latest.current?.selectMachine(1));
  expect(screen.latest.current?.graph?.name).toBe("返金");
  expect(screen.latest.current?.target).toEqual({ kind: "none" });
  expect(screen.latest.current?.zoom).toBe(1);
  expect(screen.source()).toBe(source);
});

test("無効な入力を通知し、修正後の追加で全文とグラフを同時に更新する", () => {
  const screen = screens.render(source);
  act(() => screen.latest.current?.selectPart("state"));
  act(() => {
    screen.latest.current?.changeDraft("name", "with space");
  });
  act(() => screen.latest.current?.addPart());
  expect(screen.latest.current?.error).toBe("有効な状態名を入力してください");
  expect(screen.source()).toBe(source);

  act(() => screen.latest.current?.changeDraft("name", "保留"));
  act(() => screen.latest.current?.addPart());
  expect(screen.source()).toContain("  state: 保留\nstate-machine 返金");
  expect(screen.latest.current?.graph?.nodes.map((node) => node.name)).toContain("保留");
  expect(screen.latest.current?.draft.name).toBe("");
  expect(screen.latest.current?.error).toBe("");
  expect(screen.latest.current?.target).toEqual({ kind: "part", part: "state" });
});

test("親から全文が変わるとグラフを再導出し、パーツ未選択では追加しない", () => {
  const screen = screens.render(source);
  act(() => screen.latest.current?.addPart());
  expect(screen.source()).toBe(source);
  screen.replaceSource(source.replace("  state: 申請", "  state: 申請\n  state: 終了 terminal"));
  act(() => screen.latest.current?.selectMachine(1));
  expect(screen.latest.current?.graph?.nodes.map((node) => node.name)).toEqual(["申請", "終了"]);
  expect(screen.latest.current?.layout?.nodes).toBeDefined();
});
