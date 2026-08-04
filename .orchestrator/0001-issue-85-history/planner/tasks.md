| ID | タスク | blockedBy | 状態 |
|----|-------|-----------|------|
| 1 | 仕様準拠の snapshot History 公開APIをテストで固定する（record / undo / redo / 上限100 / redo破棄） | - | pending |
| 2 | viewport 非対象・選択非対象の完了条件テストを追加する | 1 | pending |
| 3 | transaction begin / commit（連続操作の1エントリ化）のテストを追加する | 1 | pending |
| 4 | DocumentOperation + History を snapshot 方式で実装し、command 系を削除する | 1, 2, 3 | pending |
| 5 | 公開 export・既存テストの追随と Vitest 実行で完了条件を確認する | 4 | pending |
