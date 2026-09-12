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

test("プリミティブ型は未定義名に含まれていてもバッジを出さない", () => {
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
    new Set(["string"]),
  );

  expect(host.querySelector(".preview-data-card__undefined-badge")).toBeNull();
  expect(
    host
      .querySelector(".preview-data-card__type-name")
      ?.classList.contains("preview-data-card__type-name--undefined"),
  ).toBe(false);
});

test("RECORD では未定義のフィールドだけバッジを付ける", () => {
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
        ],
        range,
      ),
      range,
    }),
    new Set(["顧客情報"]),
  );
  const fields = Array.from(
    host.querySelectorAll(".preview-data-card__record-field"),
  );

  expect(
    fields[0]?.querySelector(".preview-data-card__undefined-badge"),
  ).toBeNull();
  expect(
    fields[1]?.querySelector(".preview-data-card__undefined-badge")?.textContent,
  ).toBe("未定義");
});

test("片側開放の制約は VALUE カードに int 1.. と出る", () => {
  const host = cards.render(
    DataDecl.create({
      name: "下限数量",
      nameRange: range,
      typeExpr: TypeExpr.value({
        primitive: PRIMITIVES.int,
        primitiveRange: range,
        constraint: Constraint.numeric(NumberRange.minOnly(1), range),
        range,
      }),
      range,
    }),
  );

  expect(host.querySelector(".preview-data-card__value")?.textContent).toBe(
    "int 1..",
  );
});

test("list と option を重ねた修飾は両方のタグになる", () => {
  const host = cards.render(
    DataDecl.create({
      name: "明細一覧",
      nameRange: range,
      typeExpr: TypeExpr.alias(
        TypeTerm.create({
          name: "注文明細",
          isPrimitive: false,
          modifiers: [TYPE_MODIFIERS.list, TYPE_MODIFIERS.option],
          range,
        }),
        range,
      ),
      range,
    }),
  );

  expect(
    Array.from(host.querySelectorAll(".preview-data-card__modifier")).map(
      (tag) => tag.textContent,
    ),
  ).toEqual(["list", "option"]);
});

test("CHOICE の3ケースは or を2つ挟む", () => {
  const host = cards.render(
    DataDecl.create({
      name: "配送状態",
      nameRange: range,
      typeExpr: TypeExpr.choice(
        [
          TypeTerm.create({
            name: "未発送",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
          TypeTerm.create({
            name: "配送中",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
          TypeTerm.create({
            name: "配送済み",
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

  expect(host.querySelectorAll(".preview-data-card__or")).toHaveLength(2);
  expect(host.querySelectorAll(".preview-data-card__pill")).toHaveLength(3);
});
