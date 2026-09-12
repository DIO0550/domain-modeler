import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelEditor } from "./index";

function EditableModel({ value: initialValue }: { value: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="model-editor-story">
      <ModelEditor value={value} onChange={setValue} />
    </div>
  );
}

const meta: Meta<typeof ModelEditor> = {
  component: ModelEditor,
  title: "Model/ModelEditor",
  render: (args) => <EditableModel value={args.value} />,
  argTypes: { onChange: { control: false } },
};
export default meta;
type Story = StoryObj<typeof ModelEditor>;

export const Default: Story = {
  args: {
    value: `// 注文モデル
data OrderId = string
data Quantity = int

data Order =
  OrderId
  AND Quantity
`,
  },
};
export const Empty: Story = { args: { value: "" } };
export const ParseError: Story = {
  args: {
    value: "data 数量 = int constrained 10..1\ndata 注文ID = string\n",
  },
};
export const UndefinedReference: Story = {
  args: {
    value: "data 注文 = 未検証の注文 OR 検証済みの注文\n",
  },
};
export const LongDocument: Story = {
  args: {
    value: Array.from(
      { length: 150 },
      (_, index) => `data Item${index + 1} = string // ${"長い行 ".repeat(30)}`,
    ).join("\n"),
  },
};
