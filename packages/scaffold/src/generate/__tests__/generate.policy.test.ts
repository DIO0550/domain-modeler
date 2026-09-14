import { Parse, Resolve } from "@domain-modeler/model-core";
import { expect, test } from "vitest";
import { connection, dmodel, sticky } from "./dmodel-fixture";

test("Event 入力のない Policy は未定義のトリガーと結果を残し data を生成しない", () => {
  const text = dmodel([sticky("p", "policy", "発送する")]);
  expect(text).toContain(
    "workflow 発送する =\n  input: TODOトリガーイベント\n  output: TODO結果イベント",
  );
  expect(text).not.toContain("data 発送する");
  expect(text).not.toContain("error:");
  const parsed = Parse.parse(text);
  expect(parsed.diagnostics).toEqual([]);
  expect(
    Resolve.resolve(parsed.document).diagnostics.map(
      (diagnostic) => diagnostic.message,
    ),
  ).toEqual([
    "「TODOトリガーイベント」は未定義です",
    "「TODO結果イベント」は未定義です",
  ]);
});

test("Policy の入力 Event は接続配列順で AND 結合される", () => {
  const text = dmodel(
    [
      sticky("p", "policy", "発送する"),
      sticky("e1", "event", "入金済み"),
      sticky("e2", "event", "在庫あり"),
    ],
    [connection("e2", "p"), connection("e1", "p")],
  );
  expect(text).toContain("input: 在庫あり AND 入金済み");
  const parsed = Parse.parse(text);
  expect(parsed.diagnostics).toEqual([]);
  expect(
    Resolve.resolve(parsed.document).diagnostics.map(
      (diagnostic) => diagnostic.message,
    ),
  ).toEqual(["「TODO結果イベント」は未定義です"]);
});

test("ラベル付き入力はラベルなしの項も継続行にし複数行ラベルを安全に残す", () => {
  const text = dmodel(
    [
      sticky("p", "policy", "発送する"),
      sticky("e1", "event", "入金済み"),
      sticky("e2", "event", "在庫あり"),
    ],
    [connection("e1", "p", "確認\nworkflow 偽 ="), connection("e2", "p")],
  );
  expect(text).toContain(
    "input: 入金済み // 確認\n    // workflow 偽 =\n    AND 在庫あり",
  );
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test("Policy の接続先 Command はラベルとともに直前コメントになり二段先の Event は推測しない", () => {
  const text = dmodel(
    [
      sticky("p", "policy", "発送する"),
      sticky("c", "command", "配送\n依頼"),
      sticky("e", "event", "配送済み"),
    ],
    [connection("p", "c", "自動\n実行"), connection("c", "e")],
  );
  expect(text).toContain(
    "// -> 配送\n// 依頼\n// 自動\n// 実行\nworkflow 発送する =\n  input: TODOトリガーイベント\n  output: TODO結果イベント",
  );
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test("同名 Policy は入力を統合しラベルなしの同名 Event を重複させない", () => {
  const text = dmodel(
    [
      sticky("p1", "policy", "発送 する"),
      sticky("p2", "policy", "発送\nする"),
      sticky("e1", "event", "入金済み"),
      sticky("e2", "event", "在庫あり"),
    ],
    [connection("e1", "p1"), connection("e1", "p2"), connection("e2", "p2")],
  );
  expect(text.match(/workflow 発送_する =/gu)).toHaveLength(1);
  expect(text).toContain("input: 入金済み AND 在庫あり");
});

test("入力は変換可能な Event から対象 Policy への接続だけを使う", () => {
  const text = dmodel(
    [
      sticky("p", "policy", "発送する"),
      sticky("other", "policy", "通知する"),
      sticky("a", "aggregate", "注文"),
      sticky("e", "event", "入金済み"),
      sticky("bad", "event", "1st"),
    ],
    [
      connection("a", "p"),
      connection("p", "e"),
      connection("e", "other"),
      connection("bad", "p"),
      connection("missing", "p"),
      connection("p", "missing"),
    ],
  );
  expect(text).toContain("workflow 発送する =\n  input: TODOトリガーイベント");
  expect(Parse.parse(text).diagnostics).toEqual([]);
});

test.each([
  "",
  "1st",
])("識別子化できない Policy %s は未変換欄に残る", (name) => {
  const text = dmodel([sticky("p", "policy", name)]);
  expect(text).toContain(`// policy: ${name}`);
  expect(text).not.toMatch(/^workflow /mu);
});

test("予約語の Policy は接尾辞付きの workflow になる", () => {
  expect(dmodel([sticky("p", "policy", "workflow")])).toContain(
    "workflow workflow_ =",
  );
});

test.each([
  "event",
  "command",
] as const)("Policy と同名の %s は先に作成した宣言を優先する", (type) => {
  const policy = sticky("p", "policy", "注文");
  const other = sticky("o", type, "注文");
  const policyFirst = dmodel([policy, other], [connection("o", "p")]);
  expect(policyFirst).toContain(`// ${type}: 注文`);
  expect(policyFirst).toContain("input: TODOトリガーイベント");
  const otherFirst = dmodel([other, policy]);
  expect(otherFirst).toContain("// policy: 注文");
  expect(Parse.parse(policyFirst).diagnostics).toEqual([]);
  expect(Parse.parse(otherFirst).diagnostics).toEqual([]);
});

test("Command と Policy の workflow は付箋の作成順で並ぶ", () => {
  const text = dmodel([
    sticky("p", "policy", "確認する"),
    sticky("c", "command", "発送する"),
    sticky("p2", "policy", "通知する"),
  ]);
  expect(text.match(/^workflow \S+/gmu)).toEqual([
    "workflow 確認する",
    "workflow 発送する",
    "workflow 通知する",
  ]);
});
