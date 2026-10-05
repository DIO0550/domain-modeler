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
