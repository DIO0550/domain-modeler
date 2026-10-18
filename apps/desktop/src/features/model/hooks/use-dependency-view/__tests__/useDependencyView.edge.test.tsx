import { act } from "react";
import { expect, test } from "vitest";
import { Result } from "@domain-modeler/model-core";
import { Option } from "@/utils/Option";
import { renderDependencyHook } from "./useDependencyView.test-support";

test("本文更新直後は古い本文の配置を最新の図として使わない", () => {
  const hook = renderDependencyHook("data 旧注文 = string\n");

  hook.publish();
  hook.render("data =\ndata 新注文 = int\n");

  expect(hook.view().layout).toEqual(Option.none());
  expect(hook.view().diagram.cards.map((card) => card.name)).toEqual([
    "新注文",
  ]);

  hook.publish();

  expect(Result.isOk(Option.unwrap(hook.view().layout))).toBe(true);
  hook.unmount();
});

test("遅れて届いた古い本文の計測結果で最新の図を消さない", () => {
  const hook = renderDependencyHook("data 旧注文 = string\n");

  hook.publish();
  hook.render("data 新注文 = int\n");
  hook.publish();
  hook.publish({ frame: 0 });

  expect(Result.isOk(Option.unwrap(hook.view().layout))).toBe(true);
  expect(hook.view().diagram.cards.map((card) => card.name)).toEqual([
    "新注文",
  ]);
  hook.unmount();
});

test("選択した宣言が削除されたら選択カードを返さない", () => {
  const hook = renderDependencyHook(
    "data 注文 = string\ndata 削除対象 = int\n",
  );
  const selected = hook.view().diagram.cards[1];

  act(() => hook.view().select(selected.id));
  hook.render("data 注文 = string\n");

  expect(hook.view().selected).toEqual(Option.none());
  hook.unmount();
});

test("計測領域がまだ無い場合は未計測の状態を保持する", () => {
  const hook = renderDependencyHook("data 注文 = string\n", {
    attachMeasurement: false,
  });

  expect(hook.view().layout).toEqual(Option.none());
  expect(hook.view().selected).toEqual(Option.none());
  hook.unmount();
});

test("再試行前の計測が遅れて完了しても新しい寸法を保つ", () => {
  const hook = renderDependencyHook("data 注文 = string\n");
  const card = hook.view().diagram.cards[0];

  hook.publish({ sizes: new Map() });
  act(() => hook.view().retry());
  hook.publish({ sizes: new Map([[card.id, { width: 400, height: 300 }]]) });
  hook.publish({ frame: 0 });

  expect(Option.unwrap(hook.view().layout)).toMatchObject({
    ok: true,
    value: { nodes: [{ width: 400, height: 300 }] },
  });
  hook.unmount();
});

test("文書の切替と画面の破棄で以前の計測購読を解放する", () => {
  const hook = renderDependencyHook("data 注文 = string\n");

  hook.render("data 新注文 = int\n");

  expect(hook.subscriptionCount()).toBe(1);

  hook.unmount();

  expect(hook.subscriptionCount()).toBe(0);
});

test("削除された選択モデルと同じ名前が後で追加されても選択を復活させない", () => {
  const hook = renderDependencyHook("data 注文 = string\n");

  act(() => hook.view().select(hook.view().diagram.cards[0].id));
  hook.render("data 商品 = string\n");
  hook.render("data 注文 = string\n");

  expect(hook.view().selected).toEqual(Option.none());
  expect(hook.view().inspection).toEqual(Option.none());
  hook.unmount();
});

test("描画されていない参照先への移動では現在の選択を変えない", () => {
  const hook = renderDependencyHook("data 注文 = string\n");

  act(() => hook.view().select(hook.view().diagram.cards[0].id));
  act(() => hook.view().reveal("不存在"));

  expect(Option.unwrap(hook.view().selected).name).toBe("注文");
  hook.unmount();
});

test("本文が元と同じ内容へ戻っても以前の世代の計測を採用しない", () => {
  const source = "data A = string\n";
  const hook = renderDependencyHook(source);

  hook.publish();
  hook.render("data B = int\n");
  hook.render(source);
  hook.publish({ frame: 0 });

  expect(hook.view().layout).toEqual(Option.none());
  expect(hook.view().diagram.graph.revision).toBe(2);

  hook.publish();

  expect(Option.unwrap(hook.view().layout)).toMatchObject({
    ok: true,
    value: { revision: 2 },
  });
  hook.unmount();
});
