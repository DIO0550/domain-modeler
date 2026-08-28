import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent } from "storybook/test";
import {
  Sticky as StickyModel,
  StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import { Sticky } from "../sticky";
import { CanvasView, type HistoryButton } from "./index";

const disabledHistory: HistoryButton = { availability: "disabled" };

const meta: Meta<typeof CanvasView> = {
  component: CanvasView,
  argTypes: {
    undo: { control: false },
    redo: { control: false },
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="canvas-view-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof CanvasView>;

const SAMPLE_TEXT: Readonly<Record<StickyType, string>> = {
  event: "注文が確定した",
  command: "注文を確定する",
  actor: "購買担当",
  aggregate: "注文",
  policy: "在庫が足りなければ保留する",
  readModel: "注文一覧",
  externalSystem: "決済サービス",
  hotspot: "在庫引当のタイミングは？",
};

const allStickies = StickyAppearance.all().map((appearance, index) => {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return (
    <Sticky
      key={appearance.type}
      sticky={StickyModel.create(
        StickyId.create(`stk_${appearance.type}`),
        appearance.type,
        SAMPLE_TEXT[appearance.type],
        { x: 32 + column * 220, y: 32 + row * 180 },
        appearance.defaultSize,
      )}
    />
  );
});

export const Default: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const AllTypes: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
  render: (args) => <CanvasView {...args}>{allStickies}</CanvasView>,
};

export const AllProps: Story = {
  args: {
    zoom: 1.5,
    saveStatus: "saving",
    undo: { availability: "enabled", onClick: fn() },
    redo: { availability: "enabled", onClick: fn() },
  },
  render: (args) => <CanvasView {...args}>{allStickies}</CanvasView>,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Command" }));
  },
};

export const Saving: Story = {
  args: {
    zoom: 1,
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const Failed: Story = {
  args: {
    zoom: 1,
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const HistoryEnabled: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: { availability: "enabled", onClick: fn() },
    redo: { availability: "enabled", onClick: fn() },
  },
};

export const ZoomMin: Story = {
  args: {
    zoom: 0.1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const ZoomMax: Story = {
  args: {
    zoom: 4,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const EdgeCases: Story = {
  args: {
    zoom: 0.1,
    saveStatus: "failed",
    undo: { availability: "enabled", onClick: fn() },
    redo: { availability: "disabled" },
  },
  render: (args) => <CanvasView {...args}>{allStickies}</CanvasView>,
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "External System" }),
    );
  },
};
