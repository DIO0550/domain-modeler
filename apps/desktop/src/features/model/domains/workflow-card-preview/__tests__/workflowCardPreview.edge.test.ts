import { expect, test } from "vitest";
import {
  SourceRange,
  TYPE_MODIFIERS,
  TypeTerm,
  WorkflowDecl,
  WorkflowErrorClause,
  WorkflowSection,
} from "@domain-modeler/model-core";
import { WorkflowCardPreview } from "..";

const range = SourceRange.onLine(2, 3, 20);

test("error 節なしの workflow は ERR 節を持たない", () => {
  const preview = WorkflowCardPreview.create(
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
    new Set<string>(),
  );

  expect(preview.sections.map((section) => section.kind)).toEqual([
    "input",
    "output",
  ]);
});

test("未定義の型参照は undefined 解決として節に残る", () => {
  const inputTerm = TypeTerm.create({
    name: "未検証の注文",
    isPrimitive: false,
    modifiers: [TYPE_MODIFIERS.list],
    range,
  });
  const outputTerm = TypeTerm.create({
    name: "string",
    isPrimitive: true,
    modifiers: [],
    range,
  });
  const errorTerm = TypeTerm.create({
    name: "検証エラー",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const preview = WorkflowCardPreview.create(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create([inputTerm], range),
      output: WorkflowSection.create([outputTerm], range),
      error: WorkflowErrorClause.present([errorTerm], range),
      range,
    }),
    new Set(["未検証の注文", "検証エラー", "string"]),
  );

  expect(preview.sections[0]?.terms).toEqual([
    { term: inputTerm, resolution: "undefined" },
  ]);
  expect(preview.sections[1]?.terms).toEqual([
    { term: outputTerm, resolution: "primitive" },
  ]);
  expect(preview.sections[2]?.terms).toEqual([
    { term: errorTerm, resolution: "undefined" },
  ]);
});
