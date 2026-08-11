# エラー回復パーサーの回帰テスト · 実装の手引き

> このページは implementation-plan を読んで実装に取りかかったときに
> 「ここがよく分からない」となりがちな箇所を、初学者向けの技術リファレンスとしてまとめたものです。
> 順番に読む必要はなく、詰まったセクションだけ拾い読みできます。

---

## 概要

この変更で新しいパーサーを作るわけではありません。既にあるエラー回復の仕組みが、正常な宣言と壊れた宣言が混在する編集中の文書でも期待どおり働くことを、公開 API を使った回帰テストで固定します。回帰テストとは、過去に実現した振る舞いが将来の変更によって壊れないことを確認するテストです。

パーサーは入力をまず token（意味のある最小単位）へ分解し、行頭の `data` または `workflow` を宣言の区切りである「同期点」として扱います。各区間を独立して解析するため、1つの宣言が壊れていても後続の宣言へ進めます。成功した区間は通常の宣言、失敗した区間は `ErrorDecl` となり、失敗理由は別の `diagnostics` 配列へ格納されます。

```text
.dmodel の文字列
        │
        ▼
    Tokenizer ──→ 出現順の token 列
        │
        ▼
 DeclChunk.split ──→ data/workflow ごとの宣言チャンク
        │
        ▼
 各チャンクを materialize
    ├─ 成功 ──→ DataDecl / WorkflowDecl
    └─ 失敗 ──→ ErrorDecl + Diagnostic
        │
        ▼
 ParseResult { document, tokens, diagnostics }
```

重要なのは、AST（Abstract Syntax Tree、入力の構造をプログラムから扱える形にしたもの）と診断情報が排他的ではないことです。エラーがあっても `document` は返り、複数の問題があれば `diagnostics` も複数返ります。

---

## `LANGUAGE` TypeScript

TypeScript は JavaScript に静的な型検査を加える言語です。コードを実行する前に、値の形や関数の入出力が矛盾していないかを検査できます。この計画ではテストも TypeScript で書き、`ParseResult` や宣言の `kind` を通じて、解析結果の形を安全に扱います。

このコードベースでは読み取り専用の値を `Readonly` と `readonly` で表します。解析結果を受け取った側が宣言列や diagnostics を意図せず変更しないためです。また、`kind` は判別可能な直和型の目印です。たとえば `declaration.kind === "error"` を確認すると、TypeScript はその値を `ErrorDecl` として絞り込めます。

```text
Declaration
   ├─ kind: "data"      → DataDecl
   ├─ kind: "workflow"  → WorkflowDecl
   └─ kind: "error"     → ErrorDecl
```

```ts
const result = Parse.parse(source);
const errorDeclarations = result.document.declarations.filter(
  (declaration) => declaration.kind === "error",
);

expect(errorDeclarations).toHaveLength(2);
```

> **メモ**: `readonly` は「テスト中だけ変更しない」という約束ではなく、変更操作を型検査で拒否するための指定です。

### `ParseResult`

```ts
type ParseResult = Readonly<{
  document: Document;
  tokens: readonly Token[];
  diagnostics: readonly Diagnostic[];
}>;
```

`Parse.parse` が返す結果全体の型です。成功値かエラー値のどちらか一方ではなく、部分的に構築できた文書と診断情報を同時に保持します。

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `document` | `Document` | 正常宣言と `ErrorDecl` を入力順で保持する AST です。 |
| `tokens` | `readonly Token[]` | Tokenizer が生成した出現順の token 列です。 |
| `diagnostics` | `readonly Diagnostic[]` | 利用者へ提示する問題の一覧です。 |

> **注意**: `diagnostics.length > 0` だからといって `document` が空とは限りません。この同時返却こそ、今回の回帰テストで固定する振る舞いです。

---

## `FRAMEWORK` Vitest

Vitest は Vite と親和性の高い JavaScript/TypeScript 用テストフレームワークです。`test` で確認したい振る舞いを定義し、`expect` で実際の値と期待値を比較します。この計画では内部関数を直接テストせず、利用者と同じ公開 API の `Parse.parse` を呼び出します。そうすることで「入力文字列から AST と diagnostics が返る」という外から観測可能な振る舞いを検証できます。

```text
テスト入力
   │
   ▼
Parse.parse（実際の依存を使用）
   │
   ├─ document の宣言順・kind を検証
   └─ diagnostics の件数・順序・位置を検証
```

```ts
import { expect, test } from "vitest";
import { Parse } from "..";

test("正常なASTと複数diagnosticsを同時に返す", () => {
  const result = Parse.parse(source);

  expect(result.document.declarations.map(({ kind }) => kind)).toEqual([
    "data",
    "error",
    "error",
    "data",
  ]);
  expect(result.diagnostics).toHaveLength(2);
});
```

> **メモ**: モックでチャンク解析を置き換えると、Tokenizer から結果集約までの接続不良を見逃します。今回は公開 API と実依存を使うことに価値があります。

### `test`

```ts
test(name: string, handler: () => void | Promise<void>): void
```

独立したテストケースを登録します。このリポジトリのテスト規約に合わせ、テストを不要にネストせず、1つの主要な振る舞いが分かる名前を付けます。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `name` | `string` | 利用者視点で期待する振る舞いの説明です。 |
| `handler` | `() => void \| Promise<void>` | 準備、実行、検証を行う関数です。 |

### `expect`

```ts
expect(actual: unknown): Assertion
```

実際の値を検証対象にし、`toEqual` や `toHaveLength` などの matcher（比較方法）へつなげます。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `actual` | `unknown` | 実装から得た実際の値です。 |

> **注意**: 件数だけでは順序の後退を検出できません。要件にある入力順を守るため、宣言の `kind` や diagnostic の位置も具体的に比較します。

---

## `CONCEPT` Tokenizer

Tokenizer はソース文字列を token 列へ変換する字句解析器です。token は `data` のような予約語、識別子、数値、記号、インデント、空行などを表し、元の行番号と桁番号も持ちます。パーサーが文字を1つずつ解釈する代わりに、意味のある単位を受け取れるようにする前処理です。

```text
data User
  age = number

      │ tokenize
      ▼
[reserved:data] [identifier:User] [indent] [identifier:age]
[equals:=] [reserved:number]
```

この機能では token の位置情報が重要です。`DeclChunk.split` は予約語の種類だけでなく、開始桁が1であることも同期点の条件にします。したがって、宣言本文の中にインデントされた `data` が現れても、誤って次のトップレベル宣言とは扱いません。

### `Tokenizer.tokenize`

```ts
Tokenizer.tokenize(source: string): readonly Token[]
```

ソース全文を行ごとに走査し、出現順の token 列へ変換します。入力に不明な1文字があっても、解析全体を例外で止めない設計です。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `source` | `string` | 解析対象の `.dmodel` テキスト全文です。 |

**戻り値**: 元の順序とソース位置を保持する読み取り専用の `Token` 配列です。

> **注意**: Tokenizer が token を作れたことは、宣言として文法的に正しいことを意味しません。構文上の妥当性は後段の宣言パーサーが判断します。

---

## `CONCEPT` 宣言同期点とエラー回復

エラー回復とは、構文エラーを見つけても解析全体を終了せず、安全に再開できる位置まで進む仕組みです。このパーサーでは、1桁目から始まる予約語 `data` と `workflow` を同期点にします。同期点から次の同期点の直前までが1つの `DeclChunk` です。

```text
data 正常 ─────┐ chunk 1
data 不正 ─────┤ chunk 2  ─失敗しても次へ
workflow 不正 ─┤ chunk 3  ─失敗しても次へ
data 正常 ─────┘ chunk 4
```

各チャンクは独立して `materialize` されます。その後、すべての結果を `map` で集めるため、途中の失敗が後続チャンクの処理を妨げません。末尾に次の同期点がない場合は token 列の末尾を区切りとするため、最後の不正宣言も通常どおり `ErrorDecl` と diagnostic に変換できます。

### `DeclChunk.split`

```ts
DeclChunk.split(tokens: readonly Token[]): readonly DeclChunk[]
```

token 列から同期点の index を集め、各同期点から次の同期点までを宣言チャンクとして切り出します。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `tokens` | `readonly Token[]` | Tokenizer が生成した全文の token 列です。 |

**戻り値**: 入力順に並んだ読み取り専用の `DeclChunk` 配列です。各チャンクは `kind`、`tokens`、`range` を持ちます。

> **注意**: 単に token の文字列が `data` かどうかを見るだけでは不十分です。予約語 token であり、かつ `startColumn === 1` であることがトップレベル同期点の条件です。

---

## `CONCEPT` `ErrorDecl`

`ErrorDecl` は、構文が壊れて通常の宣言にできなかった区間を AST 内で表すプレースホルダーです。エラー宣言を AST から捨てず位置だけ残すことで、エディタなどの利用者は「文書のどこに解釈できない宣言があるか」を宣言列の順序どおり扱えます。

`ErrorDecl` 自体にはメッセージを持たせません。AST 上の構造と、利用者へ説明する diagnostic の責務を分けているためです。

```text
壊れた宣言チャンク
   ├─ AST側      → ErrorDecl { kind: "error", range }
   └─ 報告側     → Diagnostic { severity, message, range }
```

```ts
expect(result.document.declarations.at(-1)?.kind).toBe("error");
expect(result.diagnostics).toHaveLength(1);
```

### `ErrorDecl.create`

```ts
ErrorDecl.create(range: SourceRange): ErrorDecl
```

壊れた宣言が占める位置から `ErrorDecl` を生成します。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `range` | `SourceRange` | 解釈できなかった宣言チャンクのソース範囲です。 |

**戻り値**: `kind: "error"` と指定された範囲を持つ読み取り専用のエラー宣言です。

> **メモ**: 今回は `ErrorDecl.create` を直接テストするのではなく、`Parse.parse` の結果に `ErrorDecl` が正しい位置と順序で含まれることを確認します。

---

## `CONCEPT` Diagnostics

Diagnostic は、ソースの問題を利用者へ伝える構造化データです。一般的な例外と違い、解析処理を中断しません。重大度を表す `severity`、人が読む `message`、問題箇所を表す `range` を持ちます。

複数の宣言チャンクが失敗した場合、各 `materialize` 結果の diagnostics を `flatMap` で1つの配列へ平坦化します。チャンクもチャンク内の診断も元の順序で処理されるため、最終的な diagnostics は入力順になります。

```text
chunk 1 diagnostics: []
chunk 2 diagnostics: [D1]
chunk 3 diagnostics: [D2]
chunk 4 diagnostics: []
             │ flatMap
             ▼
最終 diagnostics: [D1, D2]
```

```ts
expect(result.diagnostics).toHaveLength(2);
expect(
  result.diagnostics.map((diagnostic) => diagnostic.range.startLine),
).toEqual([不正dataの開始行, 不正workflowの開始行]);
```

> **注意**: diagnostic のメッセージ全文だけに依存すると、表現の改善だけでテストが壊れやすくなります。完了条件に必要な件数、順序、位置、重大度を中心に検証し、文言そのものが公開契約である場合だけ文言も固定します。

### `Parse.parse`

```ts
Parse.parse(source: string): ParseResult
```

Tokenizer、宣言チャンク分割、各宣言の materialize、AST と diagnostics の集約を一度に行う公開 API です。どのような入力でも構文エラーを理由に例外を投げず、`ParseResult` を返します。

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `source` | `string` | 解析する `.dmodel` テキスト全文です。 |

**戻り値**: 部分的な AST、token 列、0件以上の diagnostics を持つ `ParseResult` です。

---

## `CONCEPT` 回帰テストの設計

今回の中心ケースは、正常 `data`、不正 `data`、不正 `workflow`、正常 `data` を1つの入力に混在させます。これにより、エラーの前後で正常宣言が保持されること、異なる種類の不正宣言から複数 diagnostics が返ること、すべてが入力順であることを同時に確認できます。

別のケースでは、文書の最後を不正宣言にします。これは `DeclChunk.split` が「次の同期点が存在しない」という境界条件で token 列末尾を使い、停止や取りこぼしなしに結果を返すことを固定します。

```text
ケースA: 正常 → 不正 → 不正 → 正常
         └ AST保持 ─┴ 診断2件 ┴─ 後続解析を確認

ケースB: 正常 → 末尾不正 → EOF
                    └ ErrorDecl + diagnostic を確認
```

実装時は次の観点を区別すると、テストの意図が明確になります。

| 観点 | 確認内容 |
|------|----------|
| AST | 正常宣言と `ErrorDecl` が入力順に存在する |
| diagnostics | 不正宣言ごとの問題が入力順に存在する |
| 回復 | 不正宣言の後にある正常宣言も解析される |
| EOF境界 | 末尾不正宣言でも結果を返す |
| 公開契約 | 内部実装ではなく `Parse.parse` から観測する |

> **メモ**: 「例外が出なかった」だけでは不十分です。解析が静かに後続宣言を捨ててもテストが通ってしまうため、AST の具体的な宣言順まで検証します。

---

## `TOOL` pnpm と検証コマンド

pnpm はこのリポジトリのパッケージマネージャです。テストだけでなく、型検査、lint、format、build を同じ依存関係と設定で実行します。専用テストを先に実行すると短いフィードバックで修正でき、その後に全体検証を行うと既存機能への影響を確認できます。

```text
専用 Vitest
    ↓
全 Vitest
    ↓
typecheck → lint → format → build
```

```bash
pnpm exec vitest run packages/model-core/src/parse/__tests__/parse.recovery.test.ts
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run format
pnpm run build
```

> **注意**: 実際に利用できる script 名は `package.json` を確認してください。format の確認用 script が別名なら、リポジトリで定義されたコマンドを使用します。

---

## 用語集

| 用語 | 意味 |
|------|------|
| AST | ソースコードの構造を、宣言などの意味単位で表したデータです。 |
| Token | 予約語、識別子、数値、記号など、字句解析後の最小単位です。 |
| Tokenizer | 文字列を token 列へ変換する処理です。字句解析器とも呼びます。 |
| Parser | token 列を文法に従って AST へ変換する処理です。 |
| 宣言チャンク | 1つのトップレベル `data` または `workflow` 宣言に対応する token の区間です。 |
| 同期点 | エラー後に解析を安全に再開できる目印です。ここでは行頭の `data` / `workflow` です。 |
| エラー回復 | 構文エラーがあっても後続部分の解析を継続する仕組みです。 |
| `ErrorDecl` | 解釈できなかった宣言を AST 内で位置付きで表すプレースホルダーです。 |
| Diagnostic | 重大度、メッセージ、位置を持つ構造化された問題報告です。 |
| `SourceRange` | ソース上の開始位置から終了位置までを表す値です。 |
| 回帰テスト | 既に成立している振る舞いが将来の変更で壊れないことを確認するテストです。 |
| 公開 API | パッケージ利用者が正式に呼び出すために公開された入口です。 |
| EOF | End Of File の略で、入力の末尾を意味します。 |
| matcher | Vitest の `toEqual` など、実際値と期待値の比較方法です。 |
