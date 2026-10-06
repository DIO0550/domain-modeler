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

const symbolSource = `state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  state: 重複
  state: 重複
  transition: 待機 -> 完了 on 確定
  transition: 待機 -> 未定義 on 保留`;

export const StateSymbols: Story = {
  name: "初期・終端・未解決・エラーと凡例",
  args: { value: symbolSource },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole("list", { name: "状態遷移図の凡例" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "待機 initial" }),
    ).toBeVisible();
    await expect(
      canvas
        .getByRole("button", { name: "完了 terminal" })
        .querySelectorAll("rect"),
    ).toHaveLength(2);
    await expect(
      canvas.getByRole("button", { name: "未定義 unresolved" }),
    ).toHaveAttribute("data-appearance", "unresolved");
    await expect(
      canvas.getByRole("button", { name: "重複 normal" }),
    ).toHaveAttribute("data-status", "error");
  },
};

export const SelectedStateSymbols: Story = {
  name: "選択を切り替えても初期・終端の記号を保持",
  args: { value: symbolSource },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const initial = canvas.getByRole("button", { name: "待機 initial" });
    const terminal = canvas.getByRole("button", { name: "完了 terminal" });
    const initialOutline = initial.querySelector("rect")!;
    const normalStroke = getComputedStyle(initialOutline).stroke;

    await userEvent.click(initial);

    await expect(initial).toHaveAttribute("data-selected", "true");
    await expect(getComputedStyle(initialOutline).stroke).not.toBe(
      normalStroke,
    );

    await userEvent.click(terminal);

    await expect(initial).toHaveAttribute("data-selected", "false");
    await expect(getComputedStyle(initialOutline).stroke).toBe(normalStroke);
    await expect(initial.querySelector("circle")).toBeInTheDocument();
    await expect(terminal).toHaveAttribute("data-selected", "true");
    await expect(terminal.querySelectorAll("rect")).toHaveLength(2);
  },
};

export const InitialTerminalState: Story = {
  name: "初期かつ終端の状態",
  args: {
    value: "state-machine 即完了 =\n  initial: 完了\n  state: 完了 terminal",
  },
  play: async ({ canvasElement }) => {
    const node = within(canvasElement).getByRole("button", {
      name: "完了 initial-terminal",
    });

    await userEvent.click(node);

    await expect(node.querySelector("circle")).toBeInTheDocument();
    await expect(node.querySelectorAll("rect")).toHaveLength(2);
    await expect(node).toHaveAttribute("data-selected", "true");
  },
};
