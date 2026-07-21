# model-format — `.dmodel` ファイル形式定義

| 項目 | 内容 |
| --- | --- |
| 対象 | `.dmodel`(Wlaschin風ドメインモデルDSL文書) |
| 分類 | DB(永続化形式) |
| ステータス | Draft |
| 関連文書 | model-core.md(パーサー・AST)/ canvas-format.md / technical.md(自動保存・アトミック書き込み) |

---

## 1. 基本原則

- 1文書 = 1ファイル。外部データベース・sidecar を持たない自己完結形式とする
- 表現はプレーンテキスト。文字エンコーディングは UTF-8(BOMなし)、改行は LF
- 行指向のDSL。キーワードは英語、識別子は日本語を想定する(英数字も可)。ネスト構造を持たず、インデントは継続行を示す意味のみとする
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
```

## 3. 字句要素

| 要素 | 規則 |
| --- | --- |
| コメント | `//` から行末まで。行頭・行中どちらも可 |
| 空行 | 無視する。宣言の区切りとしての意味は持たない |
| 識別子 | 空白・改行を含まない連続文字列。日本語可。予約語と一致するものは不可 |
| 予約語 | `data` `workflow` `AND` `OR` `list` `option` `constrained` `length` `input:` `output:` `error:` |
| プリミティブ型 | `string` `int` `decimal` `bool` `date` `datetime` |
| インデント | 行頭の空白(スペース・タブ問わず)があれば直前の宣言の継続行とみなす |

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

## 8. 文法(EBNF風)

```
document    = { declaration } ;
declaration = data-decl | workflow-decl ;

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
```

※ 改行・継続行の扱いは字句レベルで解決する(3)。上記は論理構造のみを示す。

## 9. 参照解決

- 型参照は名前ベース。未定義の識別子への参照はパースエラーとせず、警告として扱う(書き途中の状態を許容する)
- 同名の `data` 再宣言はエラー
- 宣言順序は自由(前方参照可)

## 10. バージョニング

`.dmodel` にはバージョンマーカーを設けない。文法の変更は追加のみ(既存文書を壊さない)を原則とし、破壊的変更が必要になった場合にマーカー導入を検討する。

## 11. スコープ外

- 正規表現制約、ジェネリクス、Result型の直接表記(`output` / `error` 行分離で代替)、モジュール分割・import
- `.dcanvas` とのID相互参照(スキャフォールド生成は一方向・名前ベースであり、リンクを持たない)
