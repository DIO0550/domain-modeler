# model-format — `.dmodel` ファイル形式定義

| 項目 | 内容 |
| --- | --- |
| 対象 | `.dmodel`(Wlaschin風ドメインモデルDSL文書) |
| 分類 | DB(永続化形式) |
| ステータス | Draft |
| 関連文書 | model-core.md(パーサー・AST)/ canvas-format.md / technical.md(自動保存・アトミック書き込み) / [Issue #234](https://github.com/DIO0550/domain-modeler/issues/234) |

---

## 1. 基本原則

- 1文書 = 1ファイル。外部データベース・sidecar を持たない自己完結形式とする
- 表現はプレーンテキスト。文字エンコーディングは UTF-8(BOMなし)、改行は LF
- 行指向のDSL。キーワードは英語、識別子は日本語を想定する(英数字も可)。トップレベル宣言の入れ子は持たず、インデント行は直前のトップレベル宣言に属する
- ファイルの読み書き手順(自動保存・アトミック書き込み)は technical.md で定義する。本書は形式のみを規定する

## 2. 全体例

```
// 注文ドメインのモデル

data 注文 = 未検証の注文 OR 検証済みの注文

data 検証済みの注文 =
  注文ID
  AND 顧客情報
  AND 注文明細 list

data 注文数量 = int constrained 1..100
data 顧客名 = string constrained length 1..50
data 割引コード = 文字列 option

workflow 注文を確定する =
  input: 未検証の注文 AND 在庫状況
  output: 注文確定イベント OR 注文保留イベント
  error: 検証エラー

state-machine 注文の状態 =
  initial: 未検証
  state: 未検証
  state: 確定済み
  state: 完了 terminal
  transition: 未検証 -> 確定済み on 確定する
  transition: 確定済み -> 完了 on 配送する
```

## 3. 字句要素

| 要素 | 規則 |
| --- | --- |
| コメント | `//` から行末まで。行頭・行中どちらも可 |
| 空行 | 無視する。宣言の区切りとしての意味は持たない |
| 識別子 | 空白・改行を含まない連続文字列。日本語可。予約語と一致するものは不可 |
| 予約語 | `data` `workflow` `state-machine` `AND` `OR` `list` `option` `constrained` `length` `input:` `output:` `error:` `initial:` `state:` `transition:` `on` `terminal` |
| プリミティブ型 | `string` `int` `decimal` `bool` `date` `datetime` |
| インデント | 行頭の空白(スペース・タブ問わず)があれば直前の宣言の本文行とみなす。非インデントの宣言開始行で前の宣言を閉じる |

## 4. data宣言

```
data <識別子> = <型式>
```

型式は以下のいずれか:

| 形 | 例 | 意味 |
| --- | --- | --- |
| 単一参照 | `data 注文ID = string` | 別名・ラッパー型 |
| OR(直和) | `data 注文 = 未検証の注文 OR 検証済みの注文` | choice。2つ以上を `OR` で連結 |
| AND(直積) | `data 注文 = 注文ID AND 顧客情報` | record。2つ以上を `AND` で連結 |
| 制約付き | `data 注文数量 = int constrained 1..100` | プリミティブ型 + 制約 |

- `AND` と `OR` の混在は1宣言内で不可(どちらか一方のみ)
- `OR` の各ケースはインラインで構造を持てない。構造が必要なケースは独立した `data` として定義し、名前で参照する(本のスタイルに忠実)
- 継続行を用いた複数行記述可。連結子(`AND` / `OR`)は継続行の行頭に置く
- 型式内の各項は「識別子またはプリミティブ型 + 任意の後置修飾」

## 5. 後置修飾

型参照の直後に置き、重ねて指定できる(例: `注文明細 list option`)。

| 修飾 | 意味 |
| --- | --- |
| `list` | 0個以上の並び |
| `option` | 存在しない場合がある |

## 6. 制約構文

`constrained` はプリミティブ型の直後にのみ置ける。

| 対象型 | 構文 | 例 |
| --- | --- | --- |
| `int` / `decimal` | `constrained <範囲>` | `int constrained 1..100` |
| `string` | `constrained length <範囲>` | `string constrained length 1..50` |

範囲は `下限..上限`。片側開放を許容する(`1..` は下限のみ、`..100` は上限のみ)。下限 > 上限はパースエラー。`bool` / `date` への制約はスコープ外。

## 7. workflow宣言

```
workflow <識別子> =
  input: <型式・AND連結可>
  output: <型式・OR連結可>
  error: <型式・OR連結可>
```

| 行 | 必須 | 規則 |
| --- | --- | --- |
| `input:` | ✓ | 型参照を `AND` で複数連結可(`OR` 不可)。トリガーとなるCommandと、必要な状態・情報 |
| `output:` | ✓ | 型参照を `OR` で複数連結可(`AND` 不可)。成功時の結果イベント |
| `error:` | — | 型参照を `OR` で複数連結可(`AND` 不可)。失敗の表現。省略可 |

- 行の順序は `input` → `output` → `error` に固定する
- 各行で後置修飾(`list` / `option`)を使用可

## 8. state-machine宣言(MVP)

```text
state-machine <マシン名> =
  initial: <状態名>
  state: <状態名>
  state: <状態名> terminal
  transition: <遷移元> -> <遷移先> on <イベント名>
```

- 宣言開始行は**インデントなし**で `state-machine`、マシン名、`=` の順。`=` の後はコメント以外を置かない。本文の各行は必ず1文字以上インデントする。空行・コメント行はどこでも許可する。
- `initial:`、`state:`、`transition:` はそれぞれ独立した**1行**に書く。1行に複数の項目を連結しない。行の折り返しはMVPでは認めない。行末コメントは許可する。項目の順序は自由で、前方参照も許可する。
- `initial:` はちょうど1行必要で、同じマシン内の `state:` の名前を参照する。独立した疑似状態を作らない。初期かつ終端の状態は許可する。
- `state:` は1行につき1状態を宣言する。少なくとも1状態を宣言する。末尾の `terminal` は終端属性で、0個以上の状態に付けられる。省略した状態は通常状態となる。終端状態から出る遷移は許可しない。
- `transition:` は0行以上。同じマシンの宣言済み状態を両端に指定する有向辺で、`->` と `on` とイベント名を必須とする。1つの状態に複数の入力・出力を持てる。遷移元と遷移先が同じ自己ループも許可する(終端状態を除く)。同じ両端でもイベントが異なれば別の遷移とし、**元・先・イベントの3つがすべて同じ遷移の重複**はエラーとする。
- マシン名・状態名・イベント名はいずれも§3の単一トークンの識別子。空白を含む名前、予約語、プリミティブ型、数値トークンは使用できない。`->` は専用の区切り記号。イベント名は自由なラベルであり、`data` / `workflow` の名前への参照ではない。
- `data`・`workflow`・`state-machine` は同じ `.dmodel` 内で任意の順番に何度でも宣言できる。マシンの本文は次の非インデントの宣言開始行またはファイル末尾まで。モード切替は表示を変えるだけで、保存する文書の形式・内容は共通とする。

### 正常系の例

```text
data 注文ID = string
workflow 注文を確定する =
  input: 注文ID
  output: 注文ID

state-machine 注文 =
  transition: 未検証 -> 未検証 on 再入力
  transition: 未検証 -> 完了 on 確定
  transition: 未検証 -> 保留 on 一時保存
  transition: 保留 -> 完了 on 再開
  initial: 未検証
  state: 未検証
  state: 保留
  state: 完了 terminal

state-machine 返金 =
  initial: 申請中
  state: 申請中
  state: 終了 terminal
  transition: 申請中 -> 終了 on 承認
```

### 異常系の例

下記は**独立した例**。診断の深刻度と付与位置は §10 と model-core.md §6 に従う。

| 入力例 | 診断 |
| --- | --- |
| `state-machine 注文 =` のみ | 初期状態がないエラーと、状態がないエラー(マシン名) |
| `initial: 開始` を2行 | 2つ目の `initial:` に重複エラー |
| `initial: 不明` / `state: 開始` | `不明` に未定義状態エラー |
| `state: 開始` を2行 | 2つ目の `開始` に重複状態名エラー |
| `transition: 開始 -> 不明 on 確定` | `不明` に未定義状態エラー |
| `state: 終了 terminal` / `transition: 終了 -> 終了 on 再開` | 遷移元 `終了` に終端状態の出力遷移エラー |
| 同じ `transition: 開始 -> 終了 on 確定` を2行 | 2つ目の遷移に重複エラー |
| `transition: 開始 -> 終了` | `on` とイベント名の欠落を構文エラーとして報告 |
| `state: terminal` | 状態名の欠落を構文エラーとして報告 |

## 9. 文法(EBNF風)

```
document    = { declaration } ;
declaration = data-decl | workflow-decl | state-machine-decl ;

data-decl   = "data" identifier "=" type-expr ;
type-expr   = term { "AND" term }
            | term { "OR" term }
            | primitive "constrained" constraint ;
term        = ( identifier | primitive ) { modifier } ;
modifier    = "list" | "option" ;
primitive   = "string" | "int" | "decimal" | "bool" | "date" | "datetime" ;
constraint  = [ "length" ] range ;
range       = [ number ] ".." [ number ] ;   (* 少なくとも片側必須 *)

workflow-decl = "workflow" identifier "="
                "input:" term { "AND" term }
                "output:" term { "OR" term }
                [ "error:" term { "OR" term } ] ;

state-machine-decl = "state-machine" identifier "="
                     { machine-item } ;
machine-item = "initial:" identifier
             | "state:" identifier [ "terminal" ]
             | "transition:" identifier "->" identifier "on" identifier ;
```

※ data / workflow の改行・継続行は字句レベルで解決する。state-machine の開始行と machine-item はそれぞれ別の行とし、machine-item にはインデントが必要(§8)。文法上の `{ machine-item }` には意味上の制約(初期行ちょうど1、状態1以上)を別途適用する。

## 10. 参照解決と診断

- 型参照は名前ベース。未定義の識別子への参照はパースエラーとせず、警告として扱う(書き途中の状態を許容する)
- トップレベルの `data` / `workflow` / `state-machine` は共通の名前空間。同名の宣言は種類を問わず再宣言エラーとし、最初の宣言を定義とする
- 状態名は**マシンごと**の名前空間。別マシンやトップレベル宣言の同名は許可する。同一マシン内の重複状態名はエラーとし、最初の状態を参照先とする
- `initial:` と遷移の両端は同じマシンの状態を参照する。未定義状態は参照位置に**エラー**とする(未定義の型参照の警告とは区別する)。別マシンの状態を暗黙に参照しない
- イベント名は定義も参照解決も行わない。イベント名の重複自体は許可する
- 初期行の欠落・複数指定、状態の欠落、終端状態からの遷移、同一遷移の重複はエラー。終端状態の欠落や到達不能な状態はMVPでは診断しない
- 宣言順序は自由(前方参照可)

## 11. バージョニング

`.dmodel` にはバージョンマーカーを設けない。文法の変更は追加のみ(既存文書を壊さない)を原則とし、破壊的変更が必要になった場合にマーカー導入を検討する。

## 12. スコープ外

- 正規表現制約、ジェネリクス、Result型の直接表記(`output` / `error` 行分離で代替)、モジュール分割・import
- `.dcanvas` とのID相互参照(スキャフォールド生成は一方向・名前ベースであり、リンクを持たない)
- state-machine のガード、アクション、階層状態、並列状態、履歴、実行シミュレーション、コード生成、`.dcanvas` 連携
