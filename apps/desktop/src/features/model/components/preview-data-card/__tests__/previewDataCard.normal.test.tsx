import { afterEach, expect, test } from "vitest";
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
import { createCardRenderer } from "./previewDataCard.test-support";

const range = SourceRange.onLine(1, 1, 40);
const cards = createCardRenderer();

afterEach(() => {
  cards.unmountAll();
});

test("ALIAS カードはラベルと参照先を1行で表示する", () => {
  const host = cards.render(
    DataDecl.create({
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
    }),
  );
  const card = host.querySelector("article");

  expect(card?.getAttribute("data-card-kind")).toBe("ALIAS");
  expect(host.querySelector(".preview-data-card__kind")?.textContent).toBe(
    "ALIAS",
  );
  expect(host.querySelector(".preview-data-card__name")?.textContent).toBe(
    "注文ID",
  );
  expect(host.querySelector(".preview-data-card__type-name")?.textContent).toBe(
    "string",
  );
});

test("CHOICE カードはケースをピルで横並びにし間に or を挟む", () => {
  const host = cards.render(
    DataDecl.create({
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
    }),
  );

  expect(host.querySelector(".preview-data-card__kind")?.textContent).toBe(
    "CHOICE",
  );
  expect(
    Array.from(host.querySelectorAll(".preview-data-card__pill")).map(
      (pill) => pill.textContent,
    ),
  ).toEqual(["未検証の注文", "検証済みの注文"]);
  expect(
    Array.from(host.querySelectorAll(".preview-data-card__or")).map(
      (label) => label.textContent,
    ),
  ).toEqual(["or"]);
});

test("RECORD カードはフィールドを罫線区切りの縦リストで表示する", () => {
  const host = cards.render(
    DataDecl.create({
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
    }),
  );

  expect(host.querySelector(".preview-data-card__kind")?.textContent).toBe(
    "RECORD",
  );
  expect(
    Array.from(host.querySelectorAll(".preview-data-card__record-field")).map(
      (field) => field.querySelector(".preview-data-card__type-name")?.textContent,
    ),
  ).toEqual(["注文ID", "顧客情報", "注文明細"]);
});

test("VALUE カードはプリミティブ型と制約を int 1..100 で表示する", () => {
  const host = cards.render(
    DataDecl.create({
      name: "注文数量",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.int,
        primitiveRange: range,
        constraint: Constraint.numeric(NumberRange.both(1, 100), range),
        range,
      }),
      range,
    }),
  );

  expect(host.querySelector(".preview-data-card__kind")?.textContent).toBe(
    "VALUE",
  );
  expect(host.querySelector(".preview-data-card__value")?.textContent).toBe(
    "int 1..100",
  );
});

test("後置修飾は型名の右に小さなタグで表示する", () => {
  const host = cards.render(
    DataDecl.create({
      name: "割引コード",
      nameRange: range,
      typeExpr: TypeExpr.alias(
        TypeTerm.create({
          name: "文字列",
          isPrimitive: false,
          modifiers: [TYPE_MODIFIERS.option],
          range,
        }),
        range,
      ),
      range,
    }),
  );

  expect(host.querySelector(".preview-data-card__modifier")?.textContent).toBe(
    "option",
  );
});

test("未定義の型参照は点線下線と未定義バッジを表示する", () => {
  const host = cards.render(
    DataDecl.create({
      name: "注文",
      nameRange: range,
      typeExpr: TypeExpr.alias(
        TypeTerm.create({
          name: "検証エラー",
          isPrimitive: false,
          modifiers: [],
          range,
        }),
        range,
      ),
      range,
    }),
    new Set(["検証エラー"]),
  );

  expect(
    host
      .querySelector(".preview-data-card__type-name")
      ?.classList.contains("preview-data-card__type-name--undefined"),
  ).toBe(true);
  expect(
    host.querySelector(".preview-data-card__undefined-badge")?.textContent,
  ).toBe("未定義");
});
