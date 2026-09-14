import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ScaffoldPreview } from "./index";

const text = `// 注文キャンバス から生成 (2026-09-14)
// このファイルは叩き台です。TODO と未定義の警告を埋めて育ててください

// ---- data ----

data 注文が確定した = string // TODO 詳細化
data 注文するコマンド = string // TODO 詳細化

// ---- workflow ----

workflow 注文する {
  input: 注文するコマンド
  output: 注文が確定した
}

// ---- 未変換 ----

// actor: 顧客
`;

function PreviewFlow({ text }: Readonly<{ text: string }>) {
  const [state, setState] = useState<"preview" | "confirmed" | "cancelled">(
    "preview",
  );
  if (state !== "preview") {
    return (
      <div>
        <p role="status">
          {state === "confirmed" ? "確定しました" : "キャンセルしました"}
        </p>
        <button type="button" onClick={() => setState("preview")}>
          確認画面を開く
        </button>
      </div>
    );
  }
  return (
    <ScaffoldPreview
      text={text}
      onConfirm={() => setState("confirmed")}
      onCancel={() => setState("cancelled")}
    />
  );
}

const meta: Meta<typeof ScaffoldPreview> = {
  component: ScaffoldPreview,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
  render: ({ text }) => <PreviewFlow text={text} />,
};
export default meta;
type Story = StoryObj<typeof ScaffoldPreview>;

export const Default: Story = { args: { text } };
export const LongText: Story = {
  args: {
    text: `${text}\n${Array.from({ length: 200 }, (_, index) => `data 項目${index} = string // TODO ${"詳細化".repeat(40)}`).join("\n")}\n// 最終行\n`,
  },
};
export const Empty: Story = { args: { text: "" } };
