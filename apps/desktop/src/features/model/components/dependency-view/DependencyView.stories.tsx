import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnalyzedModel } from "../../domains/analyzed-model";
import type { ElementSize } from "@/libs/element-size";
import { DependencyView } from "./index";

const EMPTY_SIZES: typeof ElementSize.observe = (_container, report) => {
  report(new Map());

  return () => undefined;
};

function DependencyStory({
  source,
  measurement = "normal",
}: Readonly<{ source: string; measurement?: "normal" | "failure" }>) {
  const analyzed = useMemo(() => AnalyzedModel.create(source), [source]);

  return (
    <div className="dependency-view-story">
      <DependencyView.Root
        analyzed={analyzed}
        onEditSource={() => undefined}
        observeSizes={measurement === "failure" ? EMPTY_SIZES : undefined}
      >
        <DependencyView.Legend />
        <DependencyView.Graph />
        <DependencyView.Inspector />
        <DependencyView.Diagnostics />
      </DependencyView.Root>
    </div>
  );
}

const meta: Meta<typeof DependencyStory> = {
  component: DependencyStory,
  title: "Model/DependencyView",
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof DependencyStory>;

export const Normal: Story = {
  args: {
    source: `data 注文ID = string
data 数量 = int constrained 1..100
data 注文 = 注文ID AND 数量
data 結果 = 注文 OR string
workflow 注文を確定する =
  input: 注文
  output: 結果
  error: string
`,
  },
};

export const WorkflowRoles: Story = {
  args: {
    source: `data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
`,
  },
};

export const Empty: Story = { args: { source: "" } };

export const StateMachineOnly: Story = {
  args: {
    source: `state-machine 処理 =
  initial: 待機
  state: 待機
`,
  },
};

export const PartialSyntaxError: Story = {
  args: { source: "data =\ndata 注文 = 不明な注文\ndata 数量 = int\n" },
};

export const Undefined: Story = {
  args: { source: "data 注文 = 注文ID AND 未定義の数量 option\n" },
};

export const LayoutFailure: Story = {
  args: { source: "data 注文 = string\n", measurement: "failure" },
};

export const Cycles: Story = {
  args: {
    source: "data 木 = 木 list\ndata A = B\ndata B = A\ndata 孤立 = string\n",
  },
};

export const LongContent: Story = {
  args: {
    source: `data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
`,
  },
};

export const DuplicateNames: Story = {
  args: {
    source:
      "data 注文 = string\ndata 注文 = int\nworkflow 更新 =\n  input: 注文\n  output: 注文\n",
  },
};
