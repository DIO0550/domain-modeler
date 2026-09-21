# 命名規約

## 名前と実体を一致させる

**名前が約束することと、実際にやること・返すものを一致させる。** 名前を読んで想像した挙動と実装がずれていたら、名前が間違っている。

- **戻り値を名前に出す。** エラーの配列を返すだけの関数を `validate*` と名付けない(「検証して成否を返す」「不正なら例外を投げる」と読める)。集めて返すなら `collect*Errors`
- 探索していない関数に `find*` / `locate*` を使わない。位置情報を付与するだけの関数は `withLocation`
- 公開APIも同じ基準で名付ける。「仕様書の語彙だから」を理由に、戻り値と食い違う名前を入口だけ残さない
- 1つのモジュール内で語彙を混在させない。`collect*Errors` と `validate*` が同じファイルに同居している状態にしない(内部だけ直して公開APIを残すと混在が復活する)

| NG | OK | 理由 |
|---|---|---|
| `validateNode(node)` | `collectNodeErrors(node)` | エラー配列を返すだけで、検証の成否は返さない |
| `locate(location, errors)` | `withLocation(location, errors)` | 何も探していない。位置を付与している |
| `PropDefinition.validate` | `PropDefinition.collectErrors` | 同上(公開APIも例外にしない) |

## `And` を含む名前を作らない

`doAAndB` のような名前は、その関数が2つの振る舞いを持っている証拠。**名前を工夫して押し込めるのではなく、処理を分ける。** 分けられないなら、2つをまとめて表す1つの概念名を見つける(見つからないなら、やはり分けるべき処理)。

## 内容を表さない汎用語を使わない

`Entry` / `Info` / `Data` / `Detail` / `Manager` / `Helper` のような語は、何を指すのかを伝えない。ドメインの語彙で名付ける。

- **名前が思いつかないのは、その型が2つの役割を抱き合わせているサイン**であることが多い。改名で解決しようとする前に役割を分けられないか確認する(分けた結果その型自体が不要になることもある)
- 例: 「名前空間の構成要素」と「エラー報告用の位置」を1つの型に持たせていたため名前が付かなかった → 役割を分けたら型が不要になった

## フックの入出力の型名

カスタムフックの引数と戻り値に型を付けるときは、フック名を接頭辞にして対応を名前に出す。

| 位置 | 名前 | 例 |
|---|---|---|
| 入力(引数) | `Use<フック名>Params` | `UseDeclNameEditParams` |
| 出力(戻り値) | `Use<フック名>Result` | `UseAppShellResult` / `UseViewportInteractionsResult` |

- **`Use` 接頭辞を省いた `<名前>Result` をフックの戻り値に使わない。** `Result<T, E>` / `FileWriteResult` / `FileReadResult` のように、このリポジトリで接頭辞なしの `*Result` は**成否**を表す語として使っている。`Use` が付いて初めて「そのフックを呼んだ結果」と読める
- **フックの引数に `Props` を使わない。** `Props` はコンポーネントが受け取る props を指す語(`AutoSaveProviderProps` など)。フックの引数に使うとコンポーネントと区別がつかなくなる
- **`Input` も使わない。** このリポジトリでは入力欄(`libs/text-input` / `TextInput`)を指す語として使っている
- 引数が1つのドメイン値だけなら型を新設せず、その型をそのまま受け取る(名前を付けるのは複数の値をまとめるとき)

### 戻り値が名前の付くドメイン概念なら、その名前を使う

`Use<フック名>Result` は「state とハンドラの寄せ集めで、他に名前が無いもの」の既定。**戻り値が1つの概念として名前を付けられるなら、そちらを優先する**(「内容を表さない汎用語を使わない」と同じ判断)。

```typescript
// OK: 戻り値が「textarea へ渡す全文と入力イベント」という1つの概念
export type TextEditing = Readonly<{ /* ... */ }>;
export function useTextEditing(params: UseTextEditingParams): TextEditing

// OK: 寄せ集めで名前が付かないので既定の形
export type UseAppShellResult = Readonly<{ tabsState; menuState; activate; runCommand }>;
```

## ファイル名

- **ファイル名を関数名にしない。** ファイルはモジュールであり、その中の1関数の名前ではない(`resolve-prop-definition.ts` のような名前は付けない)。分割するときはモジュールとして意味のある名前を付ける
- テストファイル名は関数名ではなく**観点のラベル**にする(`rules/testing.md` の命名規則に従う)
- `src/domains/` `src/services/` `features/` のモジュールフォルダはケバブケース + `index.ts`
- `src/utils/` はフラットな PascalCase 1ファイル(`ArrayEx.ts` / `Result.ts` / `Font.ts`)

## メソッド名を既存のドメインに揃える

コンパニオンオブジェクトのメソッド名は、既にあるドメインオブジェクトの語彙に合わせる。同じ意味の操作に別の名前を与えない。

- 生成は `create`(`from` / `of` を混ぜない)
- 判定は `is*` / `has*`、変換は `to*` / `*Value`、収集は `collect*`
