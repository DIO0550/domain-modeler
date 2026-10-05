import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal
  state: 孤立
  transition: 待機 -> 処理中 on 開始
  transition: 処理中 -> 完了 on 確定
  transition: 処理中 -> 処理中 on 再試行
state-machine 返金 =
  state: 処理中
  state: 完了 terminal
  transition: 処理中 -> 完了 on 返金`;

test("選択状態の入出力遷移にイベント名と相手の状態名を表示する", () => {
  const screen = screens.render(source);

  screen.selectNode("処理中");

  expect(screen.transitionLabels("出ていく遷移")).toEqual([
    "再試行→ 処理中",
    "確定→ 完了",
  ]);
  expect(screen.transitionLabels("入ってくる遷移")).toEqual([
    "再試行← 処理中",
    "開始← 待機",
  ]);
});

test.each([
  { label: "確定→ 完了", from: "処理中", to: "完了", event: "確定" },
  { label: "開始← 待機", from: "待機", to: "処理中", event: "開始" },
  { label: "再試行← 処理中", from: "処理中", to: "処理中", event: "再試行" },
])("一覧の $label を選ぶと該当する遷移の編集画面と選択表示に移る", ({
  label,
  from,
  to,
  event,
}) => {
  const screen = screens.render(source);

  screen.selectNode("処理中");
  screen.clickInspectorButton(label);

  expect(screen.select("遷移元").value).toBe(from);
  expect(screen.select("遷移先").value).toBe(to);
  expect(
    screen.host.querySelector<HTMLInputElement>(
      'input[aria-label="イベント名"]',
    )?.value,
  ).toBe(event);
  expect(
    screen.host.querySelector(
      '.state-machine-screen__edge[data-selected="true"] text',
    )?.textContent,
  ).toBe(event);
  expect(screen.host.querySelector('ul[aria-label="出ていく遷移"]')).toBeNull();
  expect(screen.source()).toBe(source);
});

test("状態の追加ボタンから遷移元が入力済みのフォームを開き、追加した遷移を選択する", () => {
  const screen = screens.render(source);

  screen.selectNode("処理中");
  screen.clickInspectorButton("この状態から遷移を追加");

  expect(screen.select("遷移元").value).toBe("処理中");

  screen.changeSelect(screen.select("遷移先"), "待機");
  screen.enterEvent("やり直し");
  screen.submit();

  expect(screen.source()).toContain("transition: 処理中 -> 待機 on やり直し");
  expect(
    screen.host.querySelector(
      '.state-machine-screen__edge[data-selected="true"] text',
    )?.textContent,
  ).toBe("やり直し");

  screen.selectNode("処理中");

  expect(screen.transitionLabels("出ていく遷移")).toContain("やり直し→ 待機");
});

test.each([
  "",
  "  initial: 完了\n",
])("終端状態には追加ボタンを表示せず、入ってくる遷移は表示する: %s", (initial) => {
  const screen = screens.render(source.replace("  initial: 待機\n", initial));

  screen.selectNode("完了");

  expect(
    screen.host.querySelector(".state-machine-screen__inspector")?.textContent,
  ).not.toContain("この状態から遷移を追加");
  expect(screen.transitionLabels("入ってくる遷移")).toEqual(["確定← 処理中"]);
});

test("遷移がない状態は両方の一覧に空の案内を表示する", () => {
  const screen = screens.render(source);

  screen.selectNode("孤立");

  expect(screen.transitionLabels("出ていく遷移")).toEqual([]);
  expect(screen.transitionLabels("入ってくる遷移")).toEqual([]);
  expect(
    [
      ...screen.host.querySelectorAll(
        ".state-machine-screen__transition-section p",
      ),
    ].map((paragraph) => paragraph.textContent),
  ).toEqual(["遷移はありません", "遷移はありません"]);
});

test("未定義の相手の名前も一覧に表示し、未定義状態からの追加は表示しない", () => {
  const screen = screens.render(source.replace("  state: 完了 terminal\n", ""));

  screen.selectNode("処理中");

  expect(screen.transitionLabels("出ていく遷移")).toContain("確定→ 完了");

  screen.selectNode("完了");

  expect(screen.transitionLabels("入ってくる遷移")).toEqual(["確定← 処理中"]);
  expect(
    screen.host.querySelector(".state-machine-screen__inspector")?.textContent,
  ).not.toContain("この状態から遷移を追加");
});

test("DSL側で遷移を削除すると選択状態の一覧も更新する", () => {
  const screen = screens.render(source);

  screen.selectNode("処理中");
  screen.replaceSource(
    source.replace("  transition: 処理中 -> 完了 on 確定\n", ""),
  );

  expect(screen.transitionLabels("出ていく遷移")).toEqual(["再試行→ 処理中"]);
});

test("同名の状態を持つ別マシンに切り替えても対象マシンの遷移だけを表示する", () => {
  const screen = screens.render(source);

  screen.selectNode("処理中");
  screen.changeSelect(
    screen.host.querySelector<HTMLSelectElement>(
      ".state-machine-screen__toolbar select",
    )!,
    "1",
  );
  screen.selectNode("処理中");

  expect(screen.transitionLabels("出ていく遷移")).toEqual(["返金→ 完了"]);
  expect(screen.transitionLabels("入ってくる遷移")).toEqual([]);
});
