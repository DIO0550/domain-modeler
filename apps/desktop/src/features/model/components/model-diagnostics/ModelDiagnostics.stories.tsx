import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelDiagnostics } from "./index";

function EditableDiagnostics({ value: initialValue }: { value: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="model-diagnostics-story">
      <ModelDiagnostics value={value} onChange={setValue} />
    </div>
  );
}

const meta: Meta<typeof ModelDiagnostics> = {
  component: ModelDiagnostics,
  title: "Model/ModelDiagnostics",

  render: (args) => <EditableDiagnostics value={args.value} />,

  argTypes: { onChange: { control: false } },
};

export default meta;

type Story = StoryObj<typeof ModelDiagnostics>;

export const Default: Story = {
  args: {
    value: `data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`,
  },
};

export const AllProps: Story = {
  args: {
    value: `data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`,
  },
};

export const EdgeCases: Story = {
  args: {
    value: `data =
ゴミ行
data 注文 = 未定義型
`,
  },
};

export const Empty: Story = {
  args: {
    value: "",
  },
};

/** 本文編集・図の選択・表示モード往復・履歴の同期を確認する。 */
export const DependencySynchronization: Story = {
  args: {
    value: `data 注文 = 商品
data 商品 = string
data 独立 = int
state-machine 注文処理 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
`,
  },
};

export const StateMachineEditing: Story = {
  args: {
    value: `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal
  transition: 待機 -> 処理中 on 開始
  transition: 処理中 -> 完了 on 確定
`,
  },

  play: async ({ canvasElement }) => {
    const mode = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>("nav button"),
    ].find((button) => button.textContent === "ステートマシン");

    mode?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    canvasElement
      .querySelector('.state-machine-screen__node[aria-label^="待機"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  },
};

export const StateMachineTransitionEditing: Story = {
  args: StateMachineEditing.args,

  play: async ({ canvasElement }) => {
    const mode = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>("nav button"),
    ].find((button) => button.textContent === "ステートマシン");

    mode?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    canvasElement
      .querySelector(".state-machine-screen__edge")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  },
};

export const StateMachineAfterEdit: Story = {
  args: StateMachineEditing.args,

  play: async ({ canvasElement }) => {
    const mode = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>("nav button"),
    ].find((button) => button.textContent === "ステートマシン");

    mode?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    canvasElement
      .querySelector('.state-machine-screen__node[aria-label^="待機"]')
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const name = canvasElement.querySelector<HTMLInputElement>(
      'input[aria-label="状態名"]',
    );

    if (name === null) {
      return;
    }

    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set?.call(name, "保留");
    name.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    name.form?.requestSubmit();
  },
};

/** UI-07: 最初のフォーカス以降はTab・Enter・Spaceだけで図と定義を往復する。 */
export const DependencyKeyboard: Story = {
  args: {
    value: "data 注文 = 商品\ndata 商品 = string\ndata 独立 = int\n",
  },
  play: async ({ canvasElement }) => {
    const { expect, userEvent, within } = await import("storybook/test");
    const canvas = within(canvasElement);
    const diagramButton = canvas.getByRole("button", { name: /^依存図$/ });
    diagramButton.focus();
    await userEvent.keyboard("{Enter}");
    await canvas.findByRole("button", { name: "注文 ALIAS" });

    // 未選択の「関連のみ」はTab順に含まれない。
    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
    }

    await expect(
      canvas.getByRole("button", { name: "注文 ALIAS" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    for (let step = 0; step < 5; step += 1) {
      await userEvent.tab({ shift: true });
    }

    await expect(
      canvas.getByRole("button", { name: "関連のみ" }),
    ).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvasElement.querySelectorAll("[data-node-id]")).toHaveLength(
      2,
    );

    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
    }

    await expect(
      canvas.getByRole("button", { name: "商品 ALIAS" }),
    ).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(
      canvas.getByRole("button", { name: "商品 ALIAS" }),
    ).toHaveAttribute("aria-pressed", "true");

    for (let step = 0; step < 3; step += 1) {
      await userEvent.tab();
    }

    await expect(
      canvas.getByRole("button", { name: "定義を編集" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const editor = canvas.getByRole("textbox");
    await expect(editor).toHaveFocus();
    const input = canvasElement.querySelector("textarea")!;
    await expect(
      input.value.slice(input.selectionStart, input.selectionEnd),
    ).toBe("data 商品 = string");

    // エディタの前にある雛形挿入ボタン2個もTab順で通過する。
    for (let step = 0; step < 3; step += 1) {
      await userEvent.tab({ shift: true });
    }

    await expect(diagramButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(
      await canvas.findByRole("button", { name: "商品 ALIAS" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};
