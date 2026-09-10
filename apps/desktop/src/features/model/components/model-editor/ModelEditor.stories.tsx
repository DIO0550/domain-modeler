import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ModelEditor } from "./index";

function EditableModel({ value: initialValue }: { value: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div style={{ height: "calc(100vh - 32px)", minHeight: 240 }}>
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
    value:
      "// 注文モデル\ndata OrderId = string\n\ndata Order =\n  id: OrderId\n  quantity: int\n",
  },
};
export const Empty: Story = { args: { value: "" } };
export const LongDocument: Story = {
  args: {
    value: Array.from(
      { length: 150 },
      (_, index) => `data Item${index + 1} = string // ${"長い行 ".repeat(30)}`,
    ).join("\n"),
  },
};
