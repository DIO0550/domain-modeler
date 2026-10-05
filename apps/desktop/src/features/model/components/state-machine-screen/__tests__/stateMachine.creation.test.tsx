import { afterEach, expect, test } from "vitest";
import { createStateMachineRenderer } from "./stateMachine.test-support";

const screens = createStateMachineRenderer();

afterEach(() => screens.unmountAll());

const source = `data 注文ID = string
workflow 注文受付 =
  input: 注文ID
  output: 注文ID
state-machine 注文 =
  initial: 待機
  state: 待機
state-machine 返金 =
  initial: 申請
  state: 申請`;

test("既存マシンの選択中に新しいマシンを作成し、切替先へ状態を追加できる", () => {
  const screen = screens.render(source, 1);

  screen.selectNode("申請");
  screen.openMachineCreation();

  expect(screen.host.querySelector('[data-selected="true"]')).toBeNull();
  expect(
    screen.host.querySelector(".state-machine-screen__inspector h2")
      ?.textContent,
  ).toBe("新しいマシン");
  expect(screen.selectedMachineIndex()).toBe(1);

  screen.enterText("マシン名", "配送");
  screen.submit();

  expect(screen.source()).toBe(`${source}\n\nstate-machine 配送 =\n`);
  expect(screen.changes()).toHaveLength(1);
  expect(screen.selectedMachineIndex()).toBe(2);
  expect(
    screen.host.querySelector<HTMLSelectElement>(
      ".state-machine-screen__toolbar select",
    )?.selectedOptions[0]?.textContent,
  ).toBe("配送");
  expect(
    screen.host.querySelector(".state-machine-screen__details")?.textContent,
  ).toContain("配送");
  expect(screen.host.querySelector('input[aria-label="マシン名"]')).toBeNull();

  screen.openState();
  screen.enterText("状態名", "未発送");
  screen.submit();

  expect(screen.source()).toContain("state-machine 配送 =\n  state: 未発送");
  expect(screen.source().startsWith(source)).toBe(true);
  expect(
    screen.host
      .querySelector('[data-selected="true"]')
      ?.getAttribute("aria-label"),
  ).toBe("未発送 normal");
});

test.each([
  "注文ID",
  "注文受付",
  "注文",
])("既存のトップレベル宣言「%s」と同名のマシンは作成前に拒否する", (name) => {
  const screen = screens.render(source);

  screen.openMachineCreation();
  screen.enterText("マシン名", name);
  screen.submit();

  expect(screen.source()).toBe(source);
  expect(screen.changes()).toHaveLength(0);
  expect(screen.selectedMachineIndex()).toBe(0);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe(
    `「${name}」は既に宣言されています`,
  );
  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="マシン名"]')
      ?.value,
  ).toBe(name);
});

test("マシンの無い文書でも同じ検証で名前重複を拒否し、訂正すると作成できる", () => {
  const screen = screens.render("data ID = string");

  screen.enterText("マシン名", "ID");
  screen.submit();

  expect(screen.changes()).toHaveLength(0);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe(
    "「ID」は既に宣言されています",
  );

  screen.enterText("マシン名", "注文");
  screen.submit();

  expect(screen.selectedMachineIndex()).toBe(0);
  expect(screen.source()).toBe("data ID = string\n\nstate-machine 注文 =\n");
  expect(screen.host.querySelector('[role="alert"]')).toBeNull();
});

test.each([
  "",
  "with space",
])("追加作成でも識別子として無効な名前「%s」は文書を変更しない", (name) => {
  const screen = screens.render(source);

  screen.openMachineCreation();
  screen.enterText("マシン名", name);
  screen.submit();

  expect(screen.changes()).toHaveLength(0);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe(
    "有効なマシン名を入力してください",
  );
});

test("作成フォームを開いた後の文書変更も名前の重複検証に反映する", () => {
  const screen = screens.render(source);

  screen.openMachineCreation();
  screen.enterText("マシン名", "配送");
  const updated = `${source}\ndata 配送 = string`;

  screen.replaceSource(updated);
  screen.submit();

  expect(screen.source()).toBe(updated);
  expect(screen.changes()).toEqual([updated]);
  expect(screen.host.querySelector('[role="alert"]')?.textContent).toBe(
    "「配送」は既に宣言されています",
  );
});

test("Escapeで追加作成を取り消し、再び開くと空のフォームになる", () => {
  const screen = screens.render(source, 1);

  screen.openMachineCreation();
  screen.enterText("マシン名", "配送");
  screen.key("Escape");

  expect(screen.host.querySelector('input[aria-label="マシン名"]')).toBeNull();
  expect(screen.selectedMachineIndex()).toBe(1);
  expect(screen.changes()).toHaveLength(0);

  screen.openMachineCreation();

  expect(
    screen.host.querySelector<HTMLInputElement>('input[aria-label="マシン名"]')
      ?.value,
  ).toBe("");
});

test("マシン選択で追加作成を取り消し、選択した既存マシンを表示する", () => {
  const screen = screens.render(source);

  screen.openMachineCreation();
  screen.enterText("マシン名", "配送");
  screen.changeSelect(
    screen.host.querySelector<HTMLSelectElement>(
      ".state-machine-screen__toolbar select",
    )!,
    "1",
  );

  expect(screen.selectedMachineIndex()).toBe(1);
  expect(screen.host.querySelector('input[aria-label="マシン名"]')).toBeNull();
  expect(
    screen.host.querySelector(".state-machine-screen__details")?.textContent,
  ).toContain("返金");
  expect(screen.changes()).toHaveLength(0);
});
