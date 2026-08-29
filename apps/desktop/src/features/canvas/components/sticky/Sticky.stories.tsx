import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sticky as StickyModel,
  StickyId,
  type StickyType,
} from "@domain-modeler/canvas-core";
import { StickyAppearance } from "../../domains/sticky-appearance";
import { Sticky } from "./index";

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

/**
 * ストーリー用の付箋を組み立てる。
 *
 * @param type 種別。
 * @param text 本文。省略時は種別の例文。
 * @param position 左上位置。省略時は (16, 16)。
 * @returns 標準サイズの付箋。
 */
const sampleSticky = (
  type: StickyType,
  text: string = SAMPLE_TEXT[type],
  position: Readonly<{ x: number; y: number }> = { x: 16, y: 16 },
): StickyModel => {
  const appearance = StickyAppearance.of(type);
  return StickyModel.create(
    StickyId.create(`stk_${type}`),
    type,
    text,
    position,
    appearance.defaultSize,
  );
};

const meta: Meta<typeof Sticky> = {
  component: Sticky,
  argTypes: {
    sticky: { control: false },
  },
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sticky-story">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Sticky>;

export const Default: Story = {
  args: {
    sticky: sampleSticky("event"),
  },
};

export const AllProps: Story = {
  decorators: [
    (Story) => (
      <div className="sticky-story sticky-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      {StickyAppearance.all().map((appearance) => (
        <div
          key={appearance.type}
          className="sticky-story__cell"
          style={{
            width: appearance.defaultSize.width,
            height: appearance.defaultSize.height,
          }}
        >
          <Sticky
            sticky={sampleSticky(appearance.type, SAMPLE_TEXT[appearance.type], {
              x: 0,
              y: 0,
            })}
          />
        </div>
      ))}
    </>
  ),
};

export const Empty: Story = {
  args: {
    sticky: sampleSticky("command", ""),
  },
};

export const Multiline: Story = {
  args: {
    sticky: sampleSticky("policy", "在庫が足りなければ\n保留する"),
  },
};

export const Overflow: Story = {
  args: {
    sticky: sampleSticky(
      "readModel",
      "注文番号と顧客名と明細と配送先と支払い状態をすべて一覧に載せ、検索と絞り込みもできるようにする",
    ),
  },
};

export const CustomSize: Story = {
  args: {
    sticky: StickyModel.create(
      StickyId.create("stk_customsize"),
      "aggregate",
      "注文",
      { x: 16, y: 16 },
      { width: 280, height: 180 },
    ),
  },
};

export const EdgeCases: Story = {
  decorators: [
    (Story) => (
      <div className="sticky-story sticky-story--gallery">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <div className="sticky-story__cell" style={{ width: 120, height: 80 }}>
        <Sticky sticky={sampleSticky("actor", "", { x: 0, y: 0 })} />
      </div>
      <div className="sticky-story__cell" style={{ width: 140, height: 100 }}>
        <Sticky
          sticky={sampleSticky(
            "hotspot",
            "在庫引当は注文確定の前か後か、それとも非同期か、判断が分かれている",
            { x: 0, y: 0 },
          )}
        />
      </div>
      <div className="sticky-story__cell" style={{ width: 60, height: 40 }}>
        <Sticky
          sticky={StickyModel.create(
            StickyId.create("stk_tiny"),
            "event",
            "あふれる本文を最小サイズに入れる",
            { x: 0, y: 0 },
            { width: 60, height: 40 },
          )}
        />
      </div>
      <div className="sticky-story__cell" style={{ width: 160, height: 100 }}>
        <Sticky
          sticky={sampleSticky("externalSystem", "決済\nサービス\nのタイムアウト", {
            x: 0,
            y: 0,
          })}
        />
      </div>
    </>
  ),
};
