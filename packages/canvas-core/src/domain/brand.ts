// プロパティへの読み取りアクセスを防ぐために、Brand ユーティリティを独自のファイルに記述する
declare const __brand: unique symbol;
export type Brand<K, T> = K & { [__brand]: T };
