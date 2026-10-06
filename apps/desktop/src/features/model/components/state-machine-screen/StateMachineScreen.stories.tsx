import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { StateMachine } from "./index";

function EditableStateMachine({ value: initialValue }: { value: string }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <StateMachine.Root
        value={value}
        onChange={setValue}
        onEditSource={() => undefined}
      >
        <StateMachine.Palette />
        <StateMachine.Graph />
        <StateMachine.Inspector />
      </StateMachine.Root>
    </div>
  );
}

const source = `data 注文ID = string
workflow 注文受付 =
  input: 注文ID
  output: 注文ID
state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
state-machine 返金 =
  initial: 申請
  state: 申請`;

const meta = {
  component: EditableStateMachine,
  title: "Model/StateMachine",
  parameters: { layout: "fullscreen" },
  args: { value: source },
} satisfies Meta<typeof EditableStateMachine>;

export default meta;

type Story = StoryObj<typeof meta>;
type StoryCanvas = ReturnType<typeof within>;

async function openCreation(canvas: StoryCanvas) {
  await userEvent.click(
    canvas.getByRole("button", { name: "＋ 新しいマシン" }),
  );

  await expect(
    canvas.getByRole("heading", { name: "新しいマシン" }),
  ).toBeVisible();
}

async function submitMachine(canvas: StoryCanvas, name: string) {
  await openCreation(canvas);
  await userEvent.type(canvas.getByRole("textbox", { name: "マシン名" }), name);
  await userEvent.click(canvas.getByRole("button", { name: "マシンを作成" }));
}

async function rejectDuplicate(canvas: StoryCanvas, name: string) {
  await submitMachine(canvas, name);

  await expect(canvas.getByRole("alert")).toHaveTextContent(
    `「${name}」は既に宣言されています`,
  );
  await expect(canvas.getByRole("textbox", { name: "マシン名" })).toHaveValue(
    name,
  );
  await expect(canvas.getAllByRole("option")).toHaveLength(2);
}

export const ExistingMachines: Story = {
  name: "既存マシンから追加できる",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole("option")).toHaveLength(2);
    await expect(
      canvas.getByRole("button", { name: "＋ 新しいマシン" }),
    ).toBeEnabled();
  },
};

export const FirstMachine: Story = {
  name: "マシンが無い文書の作成フォーム",
  args: { value: "data 注文ID = string" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("combobox")).toBeDisabled();
    await expect(
      canvas.getByRole("textbox", { name: "マシン名" }),
    ).toBeVisible();
  },
};

export const NewMachineForm: Story = {
  name: "新しいマシンの作成フォーム",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openCreation(canvas);

    await expect(canvas.getByRole("textbox", { name: "マシン名" })).toHaveValue(
      "",
    );
    await expect(canvas.getByRole("combobox")).toHaveValue("0");
  },
};

export const DuplicateDataName: Story = {
  name: "dataと同名なら作成前にエラー",
  play: async ({ canvasElement }) => {
    await rejectDuplicate(within(canvasElement), "注文ID");
  },
};

export const DuplicateWorkflowName: Story = {
  name: "workflowと同名なら作成前にエラー",
  play: async ({ canvasElement }) => {
    await rejectDuplicate(within(canvasElement), "注文受付");
  },
};

export const DuplicateMachineName: Story = {
  name: "state-machineと同名なら作成前にエラー",
  play: async ({ canvasElement }) => {
    await rejectDuplicate(within(canvasElement), "注文");
  },
};

export const CreatedMachine: Story = {
  name: "作成したマシンへ切り替えて状態を追加",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await submitMachine(canvas, "配送");

    await expect(canvas.getByRole("combobox")).toHaveValue("2");
    await expect(canvas.getAllByRole("option")).toHaveLength(3);
    await expect(
      canvas.queryByRole("textbox", { name: "マシン名" }),
    ).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "状態" }));
    await userEvent.type(
      canvas.getByRole("textbox", { name: "状態名" }),
      "未発送",
    );
    await userEvent.click(canvas.getByRole("checkbox", { name: "初期状態" }));
    await userEvent.click(canvas.getByRole("button", { name: "追加" }));

    await expect(
      canvas.getByRole("button", { name: "未発送 initial" }),
    ).toBeVisible();
  },
};
