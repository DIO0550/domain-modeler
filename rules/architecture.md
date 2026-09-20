# アーキテクチャ規約

**この規約は「誰が誰を import してよいか」(依存の向き)を規定する。** 「どこまでが同時に正しくなければならないか」(整合性境界)は `rules/consistency.md` が規定する。2つは別の軸で、両方を満たす必要がある。

## ワークスペース構成

pnpm workspace。**UIを持たない headless なコアはパッケージへ、画面とユースケースはアプリへ**置く。

```
packages/
  model-core/       # @domain-modeler/model-core: .dmodel DSL の字句・構文解析・AST・診断・参照解決
  canvas-core/      # @domain-modeler/canvas-core: キャンバスの操作・座標変換・ヒットテスト・履歴・接続・外部取り込み
  scaffold/         # @domain-modeler/scaffold: キャンバス -> .dmodel の変換規則
apps/
  desktop/
    src/            # React アプリ(後述)
    src-tauri/      # Rust 側(後述)
```

- パッケージは**依存ゼロの headless コア**。React / Tauri API / DOM / アプリ層への依存は禁止
- パッケージ同士の依存は一方向のみ(現状 `scaffold` -> `model-core` / `canvas-core`)。循環は禁止
- 公開APIは `package.json` の `exports` で `./src/index.ts` の1点に固定する。**内部ファイルへの deep import はパッケージ解決の時点で失敗する**(規約を書き忘れても破れない)

```json
{
  "name": "@domain-modeler/canvas-core",
  "exports": { ".": "./src/index.ts" }
}
```

### パッケージ内部の構成

```
packages/<name>/src/
  index.ts     # 公開API(再export のみ)
  <domain>/    # ドメインオブジェクト(型 + 同名コンパニオンオブジェクト)
  utils/       # そのパッケージ内の汎用純粋関数(<型名>Ex)
  types/       # ロジックを持たない純粋な型定義のみ
```

**各フォルダの内部をどうモジュール分割するかは実装者の設計判断に委ねる。**

## アプリ層(apps/desktop/src)

```
apps/desktop/src/
  main.tsx / App.tsx  # エントリ層: Provider の組み立てと appShell の呼び出しのみ。薄く保つ
  appShell/           # 画面の骨格: タブ・ファイルオープン/保存・外部変更の取り込み・メニュー
  features/           # Feature 層: ユースケース単位(内部構成は後述)
  libs/               # 外部世界との境界の入口(Tauri IPC・DOM API)
  utils/              # 汎用純粋関数(ドメイン知識を持たない)
```

```
features/<feature-name>/
  index.ts     # この feature の公開API
  domains/     # この feature 固有のドメインオブジェクト
  components/  # この feature 固有のUI
  hooks/       # この feature 固有のフック
  utils/       # この feature 固有のユーティリティ
  types/       # この feature 固有の型
```

- **`src/domains/` `src/services/` はアプリ層に置かない。** 複数 feature が必要とするドメインは `packages/@domain-modeler/*` へ切り出す(後述)
- 汎用UIコンポーネント・汎用カスタムフック(ドメイン知識を持たないもの)が必要になったら `src/components/` `src/hooks/` を作る。feature 固有のものは `features/<x>/` に置いたままにする
- `appShell/` は複数 feature を1つの画面へ組み立てる場所。**ドメインロジックを書かない**(判定・計算・変換は feature の domains かパッケージへ)

## 配置の判断基準

- ドメインオブジェクトはまず `features/<x>/domains/` に置き、**2つ以上の feature が必要としたら `packages/@domain-modeler/*` へ昇格**させる(重複実装は禁止)。feature 同士の参照は公開API(`index.ts`)経由なら可だが、共有物になったら昇格させる(`rules/consistency.md`「feature の構成とネスト」)
- ロジックを持たない純粋な型定義は `types/`(feature 固有は `features/<x>/types/`、パッケージ内は `packages/<name>/src/types/`)に置く。**`domains/` 内に型定義だけのファイル(`type.ts` / `types.ts` 等)を作ることは禁止**
- `domains/` に置いてよいのは「型 + 同名コンパニオンオブジェクト」が揃ったドメインオブジェクトのみ。型はコンパニオンオブジェクトと**同一ファイル**で定義する(型だけを別ファイルに分離しない)
- I/O(Tauri API・localStorage・fetch・DOM API・外部ライブラリ)・外部フォーマットの解釈は必ず `src/libs/` 経由
- **`features/<x>/domains/` は `libs/` を import しない。** I/O の接点は hooks / components 側に置き、domains は副作用を `operations` として引数で受け取る(後述「I/O の呼び出し口」)

## I/O の呼び出し口

I/O の入口が散ると、検証を通らない書き込み経路が生まれる。**呼ぶ層を固定する。**

- `libs/` を import してよいのは `appShell/` と `features/<x>/` の hooks / components / action(React 側)まで
- `features/<x>/domains/` とパッケージは `libs/` を import しない。副作用は `XxxOperations` 型として引数で受け取り、実物を差し込むのは React 側の責務
- 例外変換(`try-catch` -> `Result`)は `libs/` の内側で完結させる。**domains 側に throw しうる関数を渡さない**(`operations` は必ず `Result` を返す形で渡す)

## libs は入口にとどめる

`libs/` は外部世界との境界の**入口**である。invoke / localStorage 等の呼び出しはここに閉じ込めるが、処理本体を 1 ファイルへ集積しない。

- 入口(`index.ts` からの再export)はあってよい
- 処理はドメインを意識してファイルを分ける(`file-read` / `file-write` など)。汎用の `tauri.ts` に読み書き・監視・ダイアログを寄せない
- 失敗の直和や手順(アトミック書き込みの一時ファイル + rename など)は、その操作のモジュールに置く
- モジュールフォルダの形は domains と同じ(`index.ts` + `__tests__/`)。フォルダ外部からの import は `index.ts` 経由のみ
- 新規作成と上書きのように同じドメインの操作は同じモジュールへ置き、結果型・例外変換を共有する。
- 新規作成は保存先選択後の競合も含めて既存ファイルを上書きしない `create_new` 相当の排他的な操作を使う。対象パスは書き込みと同期が完了するまで公開せず、排他的に確保してハンドルを保持した完成済み一時ファイルをhard linkまたはOSのno-replace renameで公開する。公開前の失敗で対象パスへ部分ファイルを残さず、既存先をパスだけで削除してはならない。別プロセスが保存先へ作成した内容を公開処理や失敗回復で置換・削除する競合を避ける。編集中のパスへの新規作成は、`..` より先に存在する親のシンボリックリンクを解決し、削除済みの参照先を持つシンボリックリンクも `read_link` で追跡する。親ディレクトリはbind mount等の別名を含むファイル同一性で比較し、対象ディレクトリ固有の大小文字・Unicode正規化規則は、追加のディレクトリ作成権限を要求せず、同じディレクトリへ長さ上限内の一意なファイル名を`create_new`して`AlreadyExists`になるかを実測する。正規化するファイルシステムで長いUnicode名を分割するときは、外部の正規化ライブラリを追加せず、左右の部分文字列がファイルシステム上で等価になる最長境界を順に実測する。WindowsのプローブはDELETEアクセス付きdelete-on-closeを使い、Unixで開いた通常ファイルをidentity-safeにunlinkできない場合は一意な隠しプローブを残して別inodeを消す競合を避ける。パス解決・比較やIPCが判定不能な場合も安全側で新規作成を拒否し、これらを含むファイルシステム上の同一性で判定して、ディスクと編集セッションの不一致を避ける。
- OSダイアログ由来のパスは非UTF-8を含めて可逆なIPC表現にし、読み書き・監視の全境界で同じ復号を使う。ファイルシステムを参照するパス比較は同期commandのハンドラースレッドで行わず、blocking taskへ委譲する。
- ファイル監視の開始・停止は、パス解決、OS watcher生成、監視スレッド終了待ちを含めてblocking taskへ委譲する。同じパスの登録は参照カウントし、1世代の解除で他の登録を停止しない。
- 比較プローブやアトミック書き込みの一時名は時刻だけで一意とみなさない。同一プロセス内のatomic nonceを含め、実際の確保は`create_new`で排他的に行い、競合時は別名を再割り当てする。
- 編集可能な文書は文書単位の自動保存セッションへ接続し、背景表示の停止境界より外側で保存タイマーを維持する。タブを閉じる前に未保存内容の書き込み完了を待ち、書き込み失敗時はタブを閉じない。保存表示は実際のセッション状態から導出する。
- 確認・保存・タブ追加などを組み合わせるフローは、保存I/Oも他の副作用と同様に operations として受け取る。フロー内で具体的なIPC実装を固定しない。

Rust 側も同じ判断にする。`#[tauri::command]` はフロントエンドとの IPC 境界なので、処理本体と混ぜず `command/` に入口だけを置く。`lib.rs` は plugin 初期化・command 登録と `run` にとどめる。ディレクトリの `mod.rs` は使わず、2018 edition のファイル形式(`command.rs` + `command/`)にする。

- `command/` は command 関数だけ。中身は対応するモジュールへ委譲する。登録は `command.rs` の `invoke_handler` に集約する
- 処理本体(読み込み・アトミック書き込み・フィルタと path 変換・監視・アプリ設定)は `file_read` / `file_write` / `file_dialog` / `file_watch` / `app_settings` に置く
- 汎用の 1 ファイルへ読み書き・監視・ダイアログ・アプリ設定の command を寄せない。ドメイン単位でファイルを分ける
- `command/` の外から内部ファイルへ deep import しない。公開APIは `command.rs` 経由のみ

```
apps/desktop/src-tauri/src/
  lib.rs              # 入口: plugin 初期化・command 登録・State と run のみ
  command.rs          # IPC 入口の登録: invoke_handler
  command/            # IPC 入口: #[tauri::command] のみ
    file_read.rs
    file_write.rs
    file_dialog.rs
    file_watch.rs
    app_settings.rs
  file_read.rs        # ファイル読み込み
  file_write.rs       # アトミック書き込み
  file_dialog.rs      # 保存/開くダイアログのフィルタと path 変換
  file_watch.rs       # ファイル監視の開始・停止と change/delete イベント
  app_settings.rs     # アプリ設定の読み書き(壊れたファイルは既定値)
```

## ロジックの帰属先

**判断の起点は「その規則は誰の性質か」。** 値を組み立てる・判定する・変換するコードは、その値を表す型のコンパニオンオブジェクトに置く。迷ったら、そのコードが第1引数に取っている型を見る。

- ある型 `T` を受け取って `T` の性質を答える関数、`T` から別の表現を作る関数は、`T` のコンパニオンオブジェクトのメソッドにする。`appShell/` や呼び出し側にヘルパー関数として置かない
- 2つの値が**常に対で意味を持つ**(片方だけでは答えが決まらない)なら、対を表す型を作ってそちらに帰属させる
- **汎用の型に個別ドメインの知識を集めない。** 「A が空のときは出力しない」のような規則は A の性質なので A 側に置く。汎用の B 側に `bFromA()` を生やすと、他のドメインもすべて B に集まって肥大化する
- 帰属先の型がまだ無いなら、**そのときが型を作るタイミング**。引数を4つも5つも取る中間ヘルパーや `readonly [string, string]` のようなタプルは、「名前の付いていない型がここにある」というサイン

## 共有の置き場を作る前にドメインを探す

「これは複数ドメインに跨るから共通の置き場が要る」と感じたときほど、**帰属先のドメインオブジェクトが見つかっていないだけ**であることが多い。そのまま置くと帰属先未定コードの集積場所ができる。

**「複数に跨る」という感触だけを根拠に共有フォルダへ置かない。** 先に次の順で置き場所を探す。

1. **その処理が第1引数に取っている型は何か** → その型のコンパニオンオブジェクトのメソッドにする
2. **2つ以上の値が常に対で渡っていないか** → 対を表す型を作り、その型に帰属させる
3. **やっていることが走査・再帰・`Result` の取り回しだけではないか** → 走査対象の型(ツリーならノードの型)がそのメソッドを持てる
4. **ドメイン知識を持たない汎用操作ではないか** → `utils/`(`<型名>Ex`)
5. **外部フォーマットの解釈・I/O ではないか** → `src/libs/`
6. **特定のユースケースでしか意味を持たない手順ではないか** → `features/<x>/`(feature 固有のドメインオブジェクトを含む)

1〜6 のどれにも当てはまらず、UIにもI/Oにも依存しないオーケストレーション(ドメインを呼ぶ順序、ツリーの走査、`Result` の取り回し)だけが残ったときは、`packages/@domain-modeler/<name>/src/` に置く。**その場合、なぜどのドメインにも帰属しないのかを PR に一言書く**(「どちらの型にも帰属しない調停そのものが目的」など)。判断が割れそうなら実装前に相談する。

- **アプリ層に `services/` を作らない。** UIにもI/Oにも依存しないなら、それはパッケージへ出せる(出せないなら、まだ何かに依存している)
- 「値の組み立て」「判定」「変換」が現れたら、それは帰属先のドメインオブジェクトが無いか、あるのに使われていないサイン
- 単一のドメインオブジェクトの検証・整合性チェックを外へ切り出さない。`XxxValidator` のようなモジュールを作らず、**そのドメインオブジェクト自身に持たせる**
- モジュール名が「対象 + 動作(`-validator` / `-manager` 等)」になったら置き場所を疑う

### 複数 feature に跨るものの行き先

| 押し出されるもの | 行き先 |
| --------------- | ------ |
| 複数 feature の UI の組み合わせ | 呼び出し元(`appShell/`) |
| 2つ以上の feature が必要とするドメイン | `packages/@domain-modeler/*` へ切り出す |
| 1操作が2つの feature に跨る手順 | 呼び出し元(`appShell/`)に置く。動詞で名付ける |

### ドメインが出力形式を必要とする場合

「CSS に出力する」など、ドメインの外側の知識が要るから外へ出す、という判断はしない。**変換手段を引数で受け取る**(変換関数・対応表を渡す)ことで、依存方向を保ったままドメインに置ける。

```typescript
// OK: 綴り方(出力層の知識)は引数で受け取る
declarations(padding: Padding, resolveToken: (token: string) => string): readonly CssDeclaration[]
```

## utils の形式

`apps/desktop/src/utils/` と `packages/<name>/src/utils/` はドメイン知識を持たない汎用純粋関数の置き場。**フラットな1ファイル + PascalCase** とし、ファイル名と同名の名前空間オブジェクトを export する(`ArrayEx` / `NumberEx` / `Option` / `EventTargetEx` / `WheelEventEx`)。フォルダ + `index.ts` の形にはしない(テストは同階層の `__tests__/` に集約)。

- 組み込み型・ブラウザ標準型に対する汎用操作は `<型名>Ex` に集約する。配列の範囲判定・挿入・移動、数値の性質判定、イベントの判定などを、ドメインや feature のローカル関数として書かない
- 汎用ユーティリティ同士も重複させない(`ArrayEx` の範囲チェックは `NumberEx.isNatural` を使う)
- ドメイン概念になった時点で `utils/` から `domains/` へ移す。判断軸は「その値に生成・判定・変換の規則が付いてくるか」

## モジュールの公開API

- モジュールフォルダ(features の各サブフォルダ、パッケージの各ドメインフォルダ)は `index.ts` を公開APIとする
- モジュールフォルダの基本形は「`index.ts` + `__tests__/`」。**実装は `index.ts` に直接書く**。複数ファイルへの分割が必要になったら、実装ファイルを1つだけ切り出すのではなく、その時点で**サブフォルダに分割**する(サブフォルダも同じ形を保つ)
- フォルダ外部からの import は必ず `index.ts` 経由とし、**内部ファイルへの deep import は禁止**
- feature は `features/<x>/index.ts` を公開APIとする。`appShell/` からの import はここ経由のみ
- パッケージは `package.json` の `exports` を公開APIとする。`packages/<name>/src/<内部>` への import は禁止
- `index.ts` から export するのは外部に公開する必要があるものだけに絞る
- **型を公開APIとして export するなら、その型と同名コンパニオンオブジェクトを別フォルダに置く。** 他モジュールの `index.ts` へ型定義だけを相乗りさせない

## 依存方向のルール(必須要件)

```
main/App -> appShell -> features/<x> -> packages/@domain-modeler/*
                  \                 \
                   `--> libs ------->`--> utils
```

- `packages/<name>/src/` は他のパッケージを `exports` 経由で import してよい(一方向のみ・循環禁止)。**React / Tauri API / DOM API / `apps/` への依存は禁止**
- `features/<x>/` は自分の内部、`packages/@domain-modeler/*`、横断層(`libs/` `utils/` と、作られていれば `components/` `hooks/` `types/`)を import 可。他 feature は**公開API(`index.ts`)経由のみ**で、内部への deep import と feature 間の循環は禁止(`rules/consistency.md`)
- 親でしか使わない feature は `features/<親>/features/<子>/` へネストする(深さ2段まで)。ネストしても公開API・循環のルールは同じ
- `features/<x>/domains/` は `packages/@domain-modeler/*` と `utils/`、他 feature の公開APIを import 可。`libs/` / React / 他 feature の内部は禁止
- `appShell/` は `features/<x>/index.ts`・横断層・パッケージを import 可。features から appShell を import してはならない
- `App.tsx` / `main.tsx` はロジックを持たない。`appShell/` の呼び出しと Provider の組み立てのみ
- `utils/` `types/`(と将来の `components/` `hooks/`)は features / appShell / パッケージを import してはならない(ドメイン知識の流入禁止)
- `libs/` は外部ライブラリ(`@tauri-apps/*`)・DOM API と `src/types/` のみ import 可
- 循環依存は全面禁止

境界は `pnpm run check:boundaries` で機械的に検査する(CI の frontend ワークフローと push 前フックで実行)。
