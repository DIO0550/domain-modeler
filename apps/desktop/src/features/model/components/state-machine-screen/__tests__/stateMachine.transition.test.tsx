import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();
afterEach(() => screens.unmountAll());

const source = `state-machine 注文 =
  initial: 待機
  state: 完了 terminal
  state: 待機
  state: 処理中
state-machine 返金 =
  state: 申請`;

test("追加フォームは対象マシンの状態だけを候補にし、終端は遷移先だけに含める", () => {
  const screen = screens.render(source);
  screen.openTransition();
  expect([...screen.select("遷移元").options].map((option) => option.value)).toEqual(["待機", "処理中"]);
  expect([...screen.select("遷移先").options].map((option) => option.value)).toEqual(["完了", "待機", "処理中"]);
  expect(screen.select("遷移元").value).toBe("待機");
  expect(screen.select("遷移先").value).toBe("完了");
});

test("選択中の状態を遷移元に引き継ぎ、状態名を入力せずに追加できる", () => {
  const screen = screens.render(source);
  screen.selectNode("処理中");
  screen.openTransition();
  expect(screen.select("遷移元").value).toBe("処理中");
  screen.enterEvent("完了通知");
  screen.submit();
  expect(screen.source()).toContain("  transition: 処理中 -> 完了 on 完了通知\nstate-machine 返金");
  expect(screen.host.querySelector('[role="alert"]')).toBeNull();
});

test("終端状態を選択していた場合は遷移元にできる先頭の状態で開く", () => {
  const screen = screens.render(source);
  screen.selectNode("完了");
  screen.openTransition();
  expect(screen.select("遷移元").value).toBe("待機");
});

test("選び直した遷移元と遷移先で追加し、同じ遷移の重複を拒否する", () => {
  const screen = screens.render(source);
  screen.openTransition();
  screen.changeSelect(screen.select("遷移元"), "処理中");
  screen.changeSelect(screen.select("遷移先"), "待機");
  screen.enterEvent("やり直し");
  screen.submit();
  const added = screen.source();
  expect(added).toContain("transition: 処理中 -> 待機 on やり直し");
  expect(screen.select("遷移元").value).toBe("処理中");
  expect(screen.select("遷移先").value).toBe("待機");
  screen.enterEvent("やり直し");
  screen.submit();
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe("同じ遷移が既にあります");
  expect(screen.source()).toBe(added);
});

test.each(["", "\n  state: 完了 terminal"])("遷移元候補がないマシンでは追加できない: %s", (states) => {
  const initial = `state-machine 注文 =${states}`;
  const screen = screens.render(initial);
  screen.openTransition();
  expect(screen.select("遷移元").options.length).toBe(0);
  screen.enterEvent("通知");
  screen.submit();
  expect(screen.source()).toBe(initial);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe("遷移元・遷移先・イベント名を入力してください");
});

test("マシンを切り替えると前の選択を引き継がず対象マシンの状態で開く", () => {
  const screen = screens.render(source);
  screen.selectNode("処理中");
  screen.openTransition();
  screen.changeSelect(screen.host.querySelector<HTMLSelectElement>(".state-machine-screen__toolbar select")!, "1");
  screen.openTransition();
  expect(screen.select("遷移元").value).toBe("申請");
  expect([...screen.select("遷移先").options].map((option) => option.value)).toEqual(["申請"]);
});

test("未定義の状態を選んでも宣言済み状態から遷移元を選ぶ", () => {
  const screen = screens.render(source.replace("state-machine 返金", "  transition: 未定義 -> 完了 on 通知\nstate-machine 返金"));
  screen.selectNode("未定義");
  screen.openTransition();
  expect(screen.select("遷移元").value).toBe("待機");
  expect([...screen.select("遷移先").options].map((option) => option.value)).not.toContain("未定義");
});

test("フォーム表示中に状態が消えても表示値と追加される遷移が一致する", () => {
  const screen = screens.render(source);
  screen.selectNode("処理中");
  screen.openTransition();
  screen.replaceSource(source.replace("  state: 処理中\n", ""));
  expect(screen.select("遷移元").value).toBe("待機");
  screen.enterEvent("完了通知");
  screen.submit();
  expect(screen.source()).toContain("transition: 待機 -> 完了 on 完了通知");
});
