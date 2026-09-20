import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";
import {
  Sticky as StickyModel,
  StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import { Sticky } from "../sticky";
import { CanvasView } from "./index";

const meta: Meta<typeof CanvasView> = {
  component: CanvasView,
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
  },
};

export const AllTypes: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saved",
  },
  render: (args) => <CanvasView {...args}>{allStickies}</CanvasView>,
};

export const AllProps: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1.5 },
    saveStatus: "saving",
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Command" }));
  },
};

export const Saving: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "saving",
  },
};

export const Failed: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 1 },
    saveStatus: "failed",
  },
};

export const ZoomMin: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 0.1 },
    saveStatus: "saved",
  },
};

export const ZoomMax: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 4 },
    saveStatus: "saved",
  },
};

export const EdgeCases: Story = {
  args: {
    viewport: { x: 0, y: 0, zoom: 0.1 },
    saveStatus: "failed",
  },
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "External System" }),
    );
  },
};
