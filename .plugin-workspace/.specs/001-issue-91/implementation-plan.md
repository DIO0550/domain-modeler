# エラー回復パーサーの回帰テスト
**関連Issue**: #91
## ユーザーレビューが必要な点
ErrorDeclを維持し、既存回復実装を再利用する方針を確認済み。
## システム図
### 状態マシン
```text
待機 → 宣言チャンク解析 ─成功→ 正常宣言追加 ┐
                 └失敗→ ErrorDecl+診断追加 ├→ 次の同期点 → 完了
```
### データフロー
```text
source → Tokenizer → DeclChunk.split → materialize[] → Document + diagnostics
```
## 変更案
### [NEW] `packages/model-core/src/parse/__tests__/parse.recovery.test.ts`
公開 `Parse.parse` を用い、正常data、不正data、不正workflow、正常dataの混在入力から、入力順のASTと2件のdiagnosticsが同時に返ることを検証する。末尾不正宣言についてもErrorDeclとdiagnosticを返すことを検証する。関数追加はない。
```ts
import { expect, test } from "vitest";
import { Parse } from "..";
```
## 検証計画
- 専用Vitest、全Vitest、typecheck、lint、format、buildを実行する。
- 公開APIのみを実依存で検証し、1テストを「ASTと複数diagnosticsを同時返却する」という一振る舞いにする。
- DeclChunkが各チャンクを一度だけ消費することをレビューする。
## Definition of Done
- [ ] ASTと複数diagnosticsを同時に返す専用テストが成功する
- [ ] 末尾エラーのテストが成功する
- [ ] 全検証が成功し、プロダクションコードを変更していない
