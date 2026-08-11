# Codebase Exploration Report: エラー回復パーサー
## 0. エグゼクティブサマリー
`Parse.parse` は `DeclChunk.split` で宣言を独立処理しdiagnosticsをflatMapするため、回復機構は実装済み。専用の複数診断回帰テストが不足する。
## 1. アーキテクチャ概要
`Parse.parse → Tokenizer → DeclChunk → DataDeclParse/WorkflowDeclParse → Document + diagnostics`
## 2. 関連コード分析
`parse/index.ts`、`parse/decl-chunk/index.ts`、data/workflow parser、Document、ErrorDeclおよび各テストを確認した。
## 3. 技術的制約・リスク
ErrorDecl除去は公開型とエディタ契約を破壊するため維持する。
## 4. 変更影響範囲
`packages/model-core/src/parse/__tests__/parse.recovery.test.ts` のみ新規追加する。
## 5. テストインフラストラクチャ
Vitest、フラットなtest、公開APIと実依存、モックなし。
## 6. 追加調査が必要な項目
なし。
## 7. ユーザー判断が必要な論点
ErrorDecl維持を確認済み。
## 8. 探索メトリクス
Read 15ファイル、スニペット5件、逆引き検索実施済み。
