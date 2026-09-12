import { act } from "react";
import { afterEach, expect, test } from "vitest";
import {
  SourceRange,
  TYPE_MODIFIERS,
  TypeTerm,
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "@domain-modeler/model-core";
import type { PreviewTypeRef } from "../../../domains/preview-type-ref";
import { createCardRenderer } from "./previewWorkflowCard.test-support";

const range = SourceRange.onLine(1, 1, 40);
const cards = createCardRenderer();

afterEach(() => {
  cards.unmountAll();
});

test("WORKFLOW ラベルと名前と IN / OUT を表示する", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "未検証の注文",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
          TypeTerm.create({
            name: "在庫状況",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "注文確定イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.absent(),
      range,
    }),
  );
  const card = host.querySelector("article");
  const inputRow = host.querySelector('[data-section="input"]');
  const outputRow = host.querySelector('[data-section="output"]');

  expect(card?.getAttribute("data-card-kind")).toBe("WORKFLOW");
  expect(host.querySelector(".preview-workflow-card__kind")?.textContent).toBe(
    "WORKFLOW",
  );
  expect(host.querySelector(".preview-workflow-card__name")?.textContent).toBe(
    "注文を確定する",
  );
  expect(inputRow?.querySelector(".preview-workflow-card__section-label")?.textContent).toBe(
    "IN",
  );
  expect(
    Array.from(inputRow?.querySelectorAll(".preview-workflow-card__type-name") ?? []).map(
      (node) => node.textContent,
    ),
  ).toEqual(["未検証の注文", "在庫状況"]);
  expect(
    inputRow?.querySelector(".preview-workflow-card__separator")?.textContent,
  ).toBe("+");
  expect(outputRow?.querySelector(".preview-workflow-card__section-label")?.textContent).toBe(
    "OUT",
  );
  expect(
    outputRow?.querySelector(".preview-workflow-card__type-name")?.textContent,
  ).toBe("注文確定イベント");
});

test("output の OR 連結は or で区切って1行に並べる", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "未検証の注文",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "注文確定イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
          TypeTerm.create({
            name: "注文保留イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.absent(),
      range,
    }),
  );
  const outputRow = host.querySelector('[data-section="output"]');

  expect(
    Array.from(outputRow?.querySelectorAll(".preview-workflow-card__type-name") ?? []).map(
      (node) => node.textContent,
    ),
  ).toEqual(["注文確定イベント", "注文保留イベント"]);
  expect(
    outputRow?.querySelector(".preview-workflow-card__separator")?.textContent,
  ).toBe("or");
});

test("error 節ありなら ERR 行を表示する", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "未検証の注文",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "注文確定イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.present(
        [
          TypeTerm.create({
            name: "検証エラー",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
          TypeTerm.create({
            name: "在庫不足",
            isPrimitive: false,
            modifiers: [TYPE_MODIFIERS.option],
            range,
          }),
        ],
        range,
      ),
      range,
    }),
  );
  const errorRow = host.querySelector('[data-section="error"]');

  expect(errorRow?.querySelector(".preview-workflow-card__section-label")?.textContent).toBe(
    "ERR",
  );
  expect(
    Array.from(errorRow?.querySelectorAll(".preview-workflow-card__type-name") ?? []).map(
      (node) => node.textContent,
    ),
  ).toEqual(["検証エラー", "在庫不足"]);
  expect(
    errorRow?.querySelector(".preview-workflow-card__separator")?.textContent,
  ).toBe("or");
  expect(errorRow?.querySelector(".preview-workflow-card__modifier")?.textContent).toBe(
    "option",
  );
});

test("名前付き型参照をクリックするとその参照を通知する", () => {
  const clicked: PreviewTypeRef[] = [];
  const host = cards.render(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "未検証の注文",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "注文確定イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.absent(),
      range,
    }),
    undefined,
    (typeRef) => {
      clicked.push(typeRef);
    },
  );
  const button = host.querySelector("button.preview-workflow-card__type-name");

  act(() => {
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(clicked).toHaveLength(1);
  expect(clicked[0]?.term.name).toBe("未検証の注文");
  expect(clicked[0]?.resolution).toBe("defined");
});

test("未定義バッジをクリックするとその参照を通知する", () => {
  const clicked: PreviewTypeRef[] = [];
  const host = cards.render(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "検証エラー",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "確定イベント",
            isPrimitive: false,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.absent(),
      range,
    }),
    new Set(["検証エラー"]),
    undefined,
    (typeRef) => {
      clicked.push(typeRef);
    },
  );
  const badge = host.querySelector(
    "button.preview-workflow-card__undefined-badge",
  );

  act(() => {
    badge?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });

  expect(clicked).toHaveLength(1);
  expect(clicked[0]?.term.name).toBe("検証エラー");
  expect(clicked[0]?.resolution).toBe("undefined");
});
