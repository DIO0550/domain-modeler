import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, userEvent } from "storybook/test";
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

export const Default: Story = {
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory,
  },
};

export const AllProps: Story = {
  args: {
    zoom: 1.5,
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
  play: async ({ canvas }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "External System" }),
    );
  },
};
