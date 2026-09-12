import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  SourceRange,
  TYPE_MODIFIERS,
  TypeTerm,
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "@domain-modeler/model-core";
import { PreviewWorkflowCard } from "./index";

const range = SourceRange.onLine(1, 1, 40);

const withError = WorkflowDecl.create({
  name: "注文を確定する",
  nameRange: range,
  input: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "未検証の注文",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "在庫状況",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  output: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "注文確定イベント",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "注文保留イベント",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  error: WorkflowErrorClause.present(
    [
      TypeTerm.create({
        name: "検証エラー",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  range,
});

const withoutError = WorkflowDecl.create({
  name: "通知する",
  nameRange: range,
  input: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "通知依頼",
        isPrimitive: false,
        modifiers: [TYPE_MODIFIERS.option],
        range,
      }),
    ],
    range,
  ),
  output: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "通知済みイベント",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  error: WorkflowErrorClause.absent(),
  range,
});

const primitiveIO = WorkflowDecl.create({
  name: "変換する",
  nameRange: range,
  input: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "string",
        isPrimitive: true,
        modifiers: [TYPE_MODIFIERS.list],
        range,
      }),
    ],
    range,
  ),
  output: WorkflowSection.create(
    [
      TypeTerm.create({
        name: "int",
        isPrimitive: true,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  error: WorkflowErrorClause.absent(),
  range,
});

const meta: Meta<typeof PreviewWorkflowCard> = {
  component: PreviewWorkflowCard,
  args: {
    onTypeRefClick: fn(),
    onUndefinedBadgeClick: fn(),
    onRename: fn(),
  },
  argTypes: {
    decl: { control: false },
    undefinedTypeNames: { control: false },
    onTypeRefClick: { control: false },
    onUndefinedBadgeClick: { control: false },
    onRename: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="preview-workflow-card-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PreviewWorkflowCard>;

export const Default: Story = {
  args: {
    decl: withError,
  },
};

export const AllProps: Story = {
  decorators: [
    (Story) => (
      <div className="preview-workflow-card-story preview-workflow-card-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <PreviewWorkflowCard {...args} decl={withError} />
      <PreviewWorkflowCard {...args} decl={withoutError} />
      <PreviewWorkflowCard {...args} decl={primitiveIO} />
    </>
  ),
};

export const EdgeCases: Story = {
  decorators: [
    (Story) => (
      <div className="preview-workflow-card-story preview-workflow-card-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <PreviewWorkflowCard
        {...args}
        decl={withoutError}
        undefinedTypeNames={new Set(["通知依頼", "通知済みイベント"])}
      />
      <PreviewWorkflowCard
        {...args}
        decl={withError}
        undefinedTypeNames={new Set(["在庫状況", "検証エラー"])}
      />
      <PreviewWorkflowCard {...args} decl={primitiveIO} />
    </>
  ),
};
