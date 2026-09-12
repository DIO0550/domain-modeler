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

const range = SourceRange.onLine(1, 1, 40);
const noUndefined = new Set<string>();

test("AND 連結の input は IN 節で + 区切りになる", () => {
  const inputTerms = [
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
  ];
  const outputTerm = TypeTerm.create({
    name: "注文確定イベント",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const preview = WorkflowCardPreview.create(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create(inputTerms, range),
      output: WorkflowSection.create([outputTerm], range),
      error: WorkflowErrorClause.absent(),
      range,
    }),
    noUndefined,
  );

  expect(preview).toEqual({
    kind: "WORKFLOW",
    name: "注文を確定する",
    sections: [
      {
        kind: "input",
        label: "IN",
        separator: "+",
        terms: [
          { term: inputTerms[0], resolution: "defined" },
          { term: inputTerms[1], resolution: "defined" },
        ],
      },
      {
        kind: "output",
        label: "OUT",
        separator: "or",
        terms: [{ term: outputTerm, resolution: "defined" }],
      },
    ],
  });
});

test("OR 連結の output は OUT 節で or 区切りになる", () => {
  const inputTerm = TypeTerm.create({
    name: "未検証の注文",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const outputTerms = [
    TypeTerm.create({
      name: "注文確定イベント",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    TypeTerm.create({
      name: "注文保留イベント",
      isPrimitive: false,
      modifiers: [TYPE_MODIFIERS.option],
      range,
    }),
  ];
  const preview = WorkflowCardPreview.create(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create([inputTerm], range),
      output: WorkflowSection.create(outputTerms, range),
      error: WorkflowErrorClause.absent(),
      range,
    }),
    noUndefined,
  );

  expect(preview.sections[1]).toEqual({
    kind: "output",
    label: "OUT",
    separator: "or",
    terms: [
      { term: outputTerms[0], resolution: "defined" },
      { term: outputTerms[1], resolution: "defined" },
    ],
  });
});

test("error 節ありの workflow は ERR 節を or 区切りで含む", () => {
  const inputTerm = TypeTerm.create({
    name: "未検証の注文",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const outputTerm = TypeTerm.create({
    name: "注文確定イベント",
    isPrimitive: false,
    modifiers: [],
    range,
  });
  const errorTerms = [
    TypeTerm.create({
      name: "検証エラー",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
    TypeTerm.create({
      name: "在庫不足",
      isPrimitive: false,
      modifiers: [],
      range,
    }),
  ];
  const preview = WorkflowCardPreview.create(
    WorkflowDecl.create({
      name: "注文を確定する",
      nameRange: range,
      input: WorkflowSection.create([inputTerm], range),
      output: WorkflowSection.create([outputTerm], range),
      error: WorkflowErrorClause.present(errorTerms, range),
      range,
    }),
    noUndefined,
  );

  expect(preview.sections).toHaveLength(3);
  expect(preview.sections[2]).toEqual({
    kind: "error",
    label: "ERR",
    separator: "or",
    terms: [
      { term: errorTerms[0], resolution: "defined" },
      { term: errorTerms[1], resolution: "defined" },
    ],
  });
});
