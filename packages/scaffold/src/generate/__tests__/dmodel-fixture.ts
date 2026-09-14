import {
  Document,
  ConnectionId,
  StickyId,
  type Sticky,
  type Connection,
} from "@domain-modeler/canvas-core";
import { Generate } from "..";

const GENERATED_ON = "2026-09-13";
const TITLE = "受注キャンバス";
const POSITION = { x: 0, y: 0 } as const;
const SIZE = { width: 100, height: 80 } as const;

/**
 * テスト用の付箋を組み立てる。
 * @param id 付箋ID文字列。
 * @param type 付箋種別。
 * @param text 付箋本文。
 * @returns 位置とサイズを固定した付箋。
 */
export const sticky = (
  id: string,
  type: Sticky["type"],
  text: string,
): Sticky => ({
  id: StickyId.create(id),
  type,
  text,
  position: POSITION,
  size: SIZE,
});

/**
 * 固定タイトル・生成日で .dmodel テキストを生成する。
 * @param stickies キャンバスの付箋列。
 * @returns 生成した .dmodel テキスト。
 */
export const dmodel = (
  stickies: readonly Sticky[],
  connections: readonly Connection[] = [],
): string =>
  Generate.toDmodelText(
    { ...Document.empty(TITLE), stickies, connections },
    GENERATED_ON,
  );

/** 接続順を明示するテスト用の接続。 */
export const connection = (
  from: string,
  to: string,
  label = "",
): Connection => ({
  id: ConnectionId.create(`${from}-${to}-${label}`),
  from: StickyId.create(from),
  to: StickyId.create(to),
  label,
  note: "",
});
