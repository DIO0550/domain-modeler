import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  type TabDocumentType,
  type TabsAction,
  TabsState,
} from "../tabs";
import { TabBar } from "./index";

const meta: Meta<typeof TabBar> = {
  component: TabBar,
  args: {
    onActivate: fn(),
  },
  argTypes: {
    onActivate: { control: false },
    tabsState: { control: false },
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="tab-bar-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof TabBar>;

const openTabs = (
  first: Readonly<{ path: string; documentType: TabDocumentType }>,
  ...rest: readonly Readonly<{ path: string; documentType: TabDocumentType }>[]
): Extract<TabsState, { status: "active" }> => {
  const documents = [first, ...rest];
  return documents.reduce<TabsState>(
    (state, document) =>
      TabsState.reducer(state, {
        type: "openTab",
        path: document.path,
        documentType: document.documentType,
      }),
    TabsState.create(),
  ) as Extract<TabsState, { status: "active" }>;
};

const applyActions = (
  state: TabsState,
  actions: readonly TabsAction[],
): TabsState => actions.reduce(TabsState.reducer, state);

export const Default: Story = {
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas",
    }),
  },
};

export const Active: Story = {
  args: {
    tabsState: openTabs(
      { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
      { path: "/Users/demo/shop/order.dmodel", documentType: "model" },
    ),
  },
};

export const Background: Story = {
  args: {
    tabsState: applyActions(
      openTabs(
        { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
        { path: "/Users/demo/shop/order.dmodel", documentType: "model" },
      ),
      [
        {
          type: "markBackgroundChanged",
          path: "/Users/demo/shop/order.dcanvas",
        },
      ],
    ),
  },
};

export const Missing: Story = {
  args: {
    tabsState: applyActions(
      openTabs({
        path: "/Users/demo/shop/order.dmodel",
        documentType: "model",
      }),
      [{ type: "markFileMissing", path: "/Users/demo/shop/order.dmodel" }],
    ),
  },
};

export const AllProps: Story = {
  args: {
    tabsState: applyActions(
      openTabs(
        { path: "/Users/demo/shop/order.dcanvas", documentType: "canvas" },
        {
          path: "/Users/demo/warehouse/order.dcanvas",
          documentType: "canvas",
        },
        { path: "/Users/demo/shop/order.dmodel", documentType: "model" },
      ),
      [
        {
          type: "markFileMissing",
          path: "/Users/demo/shop/order.dmodel",
        },
        {
          type: "markBackgroundChanged",
          path: "/Users/demo/warehouse/order.dcanvas",
        },
        {
          type: "activateTab",
          path: "/Users/demo/shop/order.dcanvas",
        },
      ],
    ),
  },
};

export const Empty: Story = {
  args: {
    tabsState: TabsState.create(),
  },
};

export const EdgeCases: Story = {
  args: {
    tabsState: applyActions(
      openTabs(
        {
          path: "/home/user/shop/docs/very-long-domain-model-name.dcanvas",
          documentType: "canvas",
        },
        {
          path: "/home/user/warehouse/docs/very-long-domain-model-name.dcanvas",
          documentType: "canvas",
        },
        { path: "/order.dmodel", documentType: "model" },
        { path: "/tmp/order.dmodel", documentType: "model" },
      ),
      [
        {
          type: "markFileMissing",
          path: "/home/user/warehouse/docs/very-long-domain-model-name.dcanvas",
        },
        { type: "markBackgroundChanged", path: "/tmp/order.dmodel" },
        {
          type: "activateTab",
          path: "/home/user/shop/docs/very-long-domain-model-name.dcanvas",
        },
      ],
    ),
  },
};
