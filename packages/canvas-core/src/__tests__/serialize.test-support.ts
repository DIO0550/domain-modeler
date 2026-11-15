/** 読込時の型検証に使う、接続を持つ最小のキャンバス文書。 */
export const setupSerializedCanvas = () => ({
  version: "1.0",
  title: "注文",
  viewport: { x: 0, y: 0, zoom: 1 },
  stickies: [
    {
      id: "stk_aaaaaaaaaaaa",
      type: "command",
      text: "注文する",
      position: { x: -10.5, y: 20.25 },
      size: { width: 160, height: 100 },
    },
    {
      id: "stk_bbbbbbbbbbbb",
      type: "event",
      text: "注文された",
      position: { x: 300, y: 20 },
      size: { width: 160, height: 100 },
    },
  ],
  connections: [
    {
      id: "con_aaaaaaaaaaaa",
      from: "stk_aaaaaaaaaaaa",
      to: "stk_bbbbbbbbbbbb",
      label: "確定後",
    },
  ],
});
