export type Anchor = "top" | "right" | "bottom" | "left";

export interface Connection {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly fromAnchor?: Anchor;
  readonly toAnchor?: Anchor;
  readonly label: string;
  readonly note: string;
}

export const Connection = {
  create: (
    id: string,
    from: string,
    to: string,
    label: string,
    note: string,
  ): Connection => ({ id, from, to, label, note }),
};
