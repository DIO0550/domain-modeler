import { act } from "react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { renderDependencyHook } from "./useDependencyView.test-support";

test("選択なしの関連のみ要求では全体を維持する", () => {
  const hook = renderDependencyHook("data 注文 = string\n");

  act(() => hook.view().setMode("related"));

  expect(hook.view().mode).toBe("all");
  expect(hook.view().selected).toEqual(Option.none());
  hook.unmount();
});

test("関連のみ表示の切替と追従で全文書の配置を再計算しない", () => {
  const hook = renderDependencyHook(
    "data 注文 = ID\ndata ID = string\ndata 他 = int\n",
  );

  hook.publish();

  const layout = hook.view().layout;

  act(() => hook.view().select(hook.view().diagram.cards[0].id));
  act(() => hook.view().setMode("related"));
  act(() => hook.view().select(hook.view().diagram.cards[1].id));

  expect(hook.view().mode).toBe("related");
  expect(hook.view().layout).toBe(layout);
  expect(hook.view().visibleDiagram.cards.map((card) => card.name)).toEqual([
    "注文",
    "ID",
  ]);
  hook.unmount();
});

test("本文更新で選択が削除されると計測完了前でも全体に戻す", () => {
  const hook = renderDependencyHook("data 注文 = ID\ndata ID = string\n");

  act(() => hook.view().select(hook.view().diagram.cards[0].id));
  act(() => hook.view().setMode("related"));
  hook.render("data ID = string\ndata 他 = int\n");

  expect(hook.view().layout).toEqual(Option.none());
  expect(hook.view().mode).toBe("all");
  expect(hook.view().selected).toEqual(Option.none());
  expect(hook.view().visibleDiagram.cards.map((card) => card.name)).toEqual([
    "ID",
    "他",
  ]);
  hook.unmount();
});
