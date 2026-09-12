import { afterEach, expect, test } from "vitest";
import {
  SourceRange,
  TypeTerm,
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "@domain-modeler/model-core";
import { createCardRenderer } from "./previewWorkflowCard.test-support";

const range = SourceRange.onLine(1, 1, 40);
const cards = createCardRenderer();

afterEach(() => {
  cards.unmountAll();
});

test("error 節なしの workflow は ERR 行を出さない", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "通知する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "通知依頼",
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
            name: "通知済みイベント",
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

  expect(host.querySelector('[data-section="error"]')).toBeNull();
  expect(host.querySelectorAll(".preview-workflow-card__section")).toHaveLength(2);
});

test("プリミティブ型はボタンにせず未定義バッジも出さない", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "変換する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "string",
            isPrimitive: true,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      output: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "int",
            isPrimitive: true,
            modifiers: [],
            range,
          }),
        ],
        range,
      ),
      error: WorkflowErrorClause.absent(),
      range,
    }),
    new Set(["string", "int"]),
  );

  expect(host.querySelector("button.preview-workflow-card__type-name")).toBeNull();
  expect(host.querySelector(".preview-workflow-card__undefined-badge")).toBeNull();
  expect(
    host
      .querySelector(".preview-workflow-card__type-name")
      ?.classList.contains("preview-workflow-card__type-name--primitive"),
  ).toBe(true);
});

test("未定義の型参照は点線下線と未定義バッジを表示する", () => {
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
        ],
        range,
      ),
      range,
    }),
    new Set(["検証エラー"]),
  );
  const errorName = host
    .querySelector('[data-section="error"]')
    ?.querySelector(".preview-workflow-card__type-name");

  expect(
    errorName?.classList.contains("preview-workflow-card__type-name--undefined"),
  ).toBe(true);
  expect(
    host.querySelector(".preview-workflow-card__undefined-badge")?.textContent,
  ).toBe("未定義");
  expect(errorName?.tagName).toBe("SPAN");
});

test("クリック通知が無いとき名前付き参照はボタンにしない", () => {
  const host = cards.render(
    WorkflowDecl.create({
      name: "通知する",
      nameRange: range,
      input: WorkflowSection.create(
        [
          TypeTerm.create({
            name: "通知依頼",
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
            name: "通知済みイベント",
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

  expect(host.querySelector("button.preview-workflow-card__type-name")).toBeNull();
  expect(host.querySelector(".preview-workflow-card__type-name")?.tagName).toBe(
    "SPAN",
  );
});

test("IN の + は直後の型参照と同じまとまりになる", () => {
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
  const groupedTerm = host.querySelector(
    '[data-section="input"] .preview-workflow-card__term:nth-child(2)',
  );

  expect(groupedTerm?.querySelector(".preview-workflow-card__separator")?.textContent).toBe(
    "+",
  );
  expect(groupedTerm?.querySelector(".preview-workflow-card__type-name")?.textContent).toBe(
    "在庫状況",
  );
});
