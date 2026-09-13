import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  Constraint,
  DataDecl,
  NumberRange,
  PRIMITIVES,
  SourceRange,
  TYPE_MODIFIERS,
  TypeExpr,
  TypeTerm,
} from "@domain-modeler/model-core";
import { PreviewDataCard } from "./index";

const range = SourceRange.onLine(1, 1, 40);

const aliasCard = DataDecl.create({
  name: "注文ID",
  nameRange: range,
  typeExpr: TypeExpr.alias(
    TypeTerm.create({
      name: "string",
      isPrimitive: true,
      modifiers: [],
      range,
    }),
    range,
  ),
  range,
});

const choiceCard = DataDecl.create({
  name: "注文",
  nameRange: range,
  typeExpr: TypeExpr.choice(
    [
      TypeTerm.create({
        name: "未検証の注文",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "検証済みの注文",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
    ],
    range,
  ),
  range,
});

const recordCard = DataDecl.create({
  name: "検証済みの注文",
  nameRange: range,
  typeExpr: TypeExpr.record(
    [
      TypeTerm.create({
        name: "注文ID",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "顧客情報",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "注文明細",
        isPrimitive: false,
        modifiers: [TYPE_MODIFIERS.list],
        range,
      }),
    ],
    range,
  ),
  range,
});

const valueCard = DataDecl.create({
  name: "注文数量",
  nameRange: range,
  typeExpr: TypeExpr.value({
    primitive: PRIMITIVES.int,
    primitiveRange: range,
    constraint: Constraint.numeric(NumberRange.both(1, 100), range),
    range,
  }),
  range,
});

const undefinedRecordCard = DataDecl.create({
  name: "検証済みの注文",
  nameRange: range,
  typeExpr: TypeExpr.record(
    [
      TypeTerm.create({
        name: "注文ID",
        isPrimitive: false,
        modifiers: [],
        range,
      }),
      TypeTerm.create({
        name: "顧客情報",
        isPrimitive: false,
        modifiers: [TYPE_MODIFIERS.option],
        range,
      }),
      TypeTerm.create({
        name: "注文明細",
        isPrimitive: false,
        modifiers: [TYPE_MODIFIERS.list, TYPE_MODIFIERS.option],
        range,
      }),
    ],
    range,
  ),
  range,
});

const openRangeCard = DataDecl.create({
  name: "下限数量",
  nameRange: range,
  typeExpr: TypeExpr.value({
    primitive: PRIMITIVES.int,
    primitiveRange: range,
    constraint: Constraint.numeric(NumberRange.minOnly(1), range),
    range,
  }),
  range,
});

const meta: Meta<typeof PreviewDataCard> = {
  component: PreviewDataCard,
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
      <div className="preview-data-card-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PreviewDataCard>;

export const Default: Story = {
  args: {
    decl: aliasCard,
  },
};

export const AllProps: Story = {
  decorators: [
    (Story) => (
      <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <PreviewDataCard {...args} decl={choiceCard} />
      <PreviewDataCard {...args} decl={recordCard} />
      <PreviewDataCard {...args} decl={aliasCard} />
      <PreviewDataCard {...args} decl={valueCard} />
    </>
  ),
};

export const EdgeCases: Story = {
  decorators: [
    (Story) => (
      <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <PreviewDataCard
        {...args}
        decl={undefinedRecordCard}
        undefinedTypeNames={new Set(["顧客情報", "注文明細"])}
      />
      <PreviewDataCard {...args} decl={openRangeCard} />
      <PreviewDataCard
        {...args}
        decl={choiceCard}
        undefinedTypeNames={new Set(["未検証の注文", "検証済みの注文"])}
      />
    </>
  ),
};
