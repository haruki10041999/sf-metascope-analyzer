# Diff の動作検証サンプル

`before/` と `after/` の同じ名前のファイルを、本番と同じ流れ（`ApexParser.parseApexClass`）で JSON にして、`makeUnitDiffs` で比べる。

```sh
npx ttsx --noCheck docs/examples/apex-diff/run-diff.ts
```

| 出力                                                 | 内容                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| [diff-output/summary.md](./diff-output/summary.md)   | unchanged 以外の差分を、ソースの行と文字列付きで木の形に並べたもの         |
| [diff-output/coverage.md](./diff-output/coverage.md) | JsonType / StructureJsonType の kind ごとの、JSON と差分のノードへの出現数 |
| diff-output/unit-diff.json                           | `makeUnitDiffs` の結果（`target` は大きいので除く）                        |

期待どおりかどうかは、テスト [test/processor/diff-samples.test.ts](../../../test/processor/diff-samples.test.ts) で確かめる。サンプルは、すべての kind が差分のノードとして 1 回以上現れるように書いている（テストでも確認する）。

## サンプルと期待する差分

| ファイル                          | 変更                                                      | 期待する差分                                                                                                                                                                                                                              |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountService.cls`              | クラスの修飾子・アノテーション・implements                | `with sharing` → `without sharing` は removed + added。`@RestResource` は引数 `urlMapping` の changed。`Queueable` の added                                                                                                               |
|                                   | field                                                     | `MAX_SIZE` の初期値 100 → 200 は式の木の changed。`private` → `protected` は修飾子だけの changed。`first, second` → `first, second, third` は removed + added（キーが変わるため）                                                         |
|                                   | 初期化ブロック・property・enum・interface・入れ子のクラス | static 初期化ブロックの中の文、`set` の修飾子、`get` の本体、enum 定数・interface メソッドの追加、戻り値の型の変更                                                                                                                        |
|                                   | constructor / method                                      | オーバーロード `calc(Decimal, Decimal)` の added、`loop()` の removed、`report()` の added。`@Future(callout=…)` の引数の changed                                                                                                         |
|                                   | 文                                                        | if / while / do-while / for の条件、`try` の finally の文が catch へ移動（moved）、`switch` の when の追加、DML（`insert as user`、`upsert` のキー）、`runAs`、`throw`                                                                    |
|                                   | SOQL / SOSL                                               | `SELECT Id, Name` → `SELECT Name, Id` は差分にしない（順序なし）。各句（USING SCOPE / WHERE / WITH DATA CATEGORY / GROUP BY / HAVING / ORDER BY / LIMIT / OFFSET / FOR / UPDATE）の changed。SOSL の RETURNING の項目・オブジェクトの追加 |
|                                   | 式                                                        | キャスト、instanceof、単項・二項演算、三項演算子、配列の添字、`new`（Map / Set / 配列）                                                                                                                                                   |
| `AccountTrigger.trigger`          | 対象イベント・本文                                        | `triggerCase` は集合（`after update` は unchanged）。文の追加。`Trigger.isBefore` が新しい `&&` の式の中へ移動（moved）                                                                                                                   |
| `script.apex`                     | 匿名 Apex                                                 | field・メソッドはキー対応、文は GumTree。`System.debug('end')` の移動、for の中の if への文の追加                                                                                                                                         |
| `Broken.cls`                      | 構文エラーの発生                                          | 構文エラー 2 件の発生。`Integer x = ;` はエラーのノード（`error:localVariable`）の added                                                                                                                                                  |
| `Level.cls`                       | enum 定数の追加                                           | `MEDIUM` の added（順序付き列）                                                                                                                                                                                                           |
| `Shape.cls`                       | interface → abstract class                                | kind が変わるので宣言を丸ごと changed                                                                                                                                                                                                     |
| `Unchanged.cls`                   | 空行の追加だけ                                            | ファイルも中身も unchanged                                                                                                                                                                                                                |
| `OldHelper.cls` / `NewHelper.cls` | before / after の片方だけにある                           | ファイルの removed / added                                                                                                                                                                                                                |
