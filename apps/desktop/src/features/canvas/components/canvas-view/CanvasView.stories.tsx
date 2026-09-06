import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent } from "storybook/test";
import {
  Sticky as StickyModel,
  StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import { Sticky } from "../sticky";
import { CanvasView, HistoryButton } from "./index";

const disabledHistory = HistoryButton.disabled();

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
        { x: 24 + column * 190, y: 24 + row * 168 },
        appearance.defaultSize,
      )}
    />
  );
});

export const Default: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const AllTypes: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
  render: (args) => <CanvasView {...args}>{allStickies}</CanvasView>,
};

export const AllProps: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1.5 },
    saveStatus: "saving",
    undo: { availability: "enabled", onClick: fn() },
    redo: { availability: "enabled", onClick: fn() },
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Command" }));
  },
};

export const Saving: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const Failed: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const HistoryEnabled: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saved",
    undo: { availability: "enabled", onClick: fn() },
    redo: { availability: "enabled", onClick: fn() },
  },
};

export const ZoomMin: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 0.1 },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const ZoomMax: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 4 },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const EdgeCases: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 0.1 },
    saveStatus: "failed",
    undo: HistoryButton.enabled(fn()),
    redo: HistoryButton.disabled(),
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "External System" }),
    );
  },
};
