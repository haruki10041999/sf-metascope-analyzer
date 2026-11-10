# Apex のサンプル

実装の全体は [apex-implementation.md](../../apex-implementation.md)。クラス・トリガーはソースと `-meta.xml` を 1 つの単位（`class_<名前>` / `trigger_<名前>`）、匿名 Apex は 1 ファイルを 1 つの単位（`anonymous_<名前>`）として読む。

| フォルダ                                                                   | 内容                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [../repository/](../README.md) の `classes/`・`triggers/`・`scripts/apex/` | 構文をひととおり含むサンプル（`Parser*.cls`・`ParserTrigger.trigger`・`parser.apex`、構文エラーの `broken.apex`。before / after で同じ中身。IR・converter のテストが使う）と、Diff 用のクラス・トリガー・匿名 Apex（下の表） |
| [scripts/](./scripts/)                                                     | `generate-json.ts`（全サンプルの JSON）、`run-diff.ts`（before → after の Diff）                                                                                                                                             |
| [output/json/](./output/json/index.md)                                     | 単位ごとの JSON（`ApexUnitParseResult`）                                                                                                                                                                                     |
| [output/diff/](./output/diff/summary.md)                                   | `summary.md`（unchanged 以外の差分をソースの行付きで）、`coverage.md`（kind ごとの出現数）、`unit-diff.json`                                                                                                                 |

```sh
npx ttsx --noCheck docs/examples/apex/scripts/generate-json.ts
npx ttsx --noCheck docs/examples/apex/scripts/run-diff.ts
```

期待どおりかどうかは、テスト [test/processor/diff-samples.test.ts](../../../test/processor/diff-samples.test.ts)・[test/parser/apex-meta.test.ts](../../../test/parser/apex-meta.test.ts) で確かめる。サンプルは、すべての kind が差分のノードとして 1 回以上現れるように書いている（テストでも確認する）。

## サンプルと期待する差分

| ファイル                                            | 変更                                                      | 期待する差分                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AccountService.cls`                                | クラスの修飾子・アノテーション・implements                | `with sharing` → `without sharing` は removed + added。`@RestResource` は引数 `urlMapping` の changed。`Queueable` の added                                                       |
|                                                     | field                                                     | `MAX_SIZE` の初期値 100 → 200 は式の木の changed。`private` → `protected` は修飾子だけの changed。`first, second` → `first, second, third` は removed + added（キーが変わるため） |
|                                                     | 初期化ブロック・property・enum・interface・入れ子のクラス | static 初期化ブロックの中の文、`set` の修飾子、`get` の本体、enum 定数・interface メソッドの追加、戻り値の型の変更                                                                |
|                                                     | constructor / method                                      | オーバーロード `calc(Decimal, Decimal)` の added、`loop()` の removed、`report()` の added。`@Future(callout=…)` の引数の changed                                                 |
|                                                     | 文                                                        | if / while / do-while / for の条件、`try` の finally の文が catch へ移動（moved）、`switch` の when の追加、DML（`insert as user`、`upsert` のキー）、`runAs`、`throw`            |
|                                                     | SOQL / SOSL                                               | `SELECT Id, Name` → `SELECT Name, Id` は差分にしない（順序なし）。各句と副問い合わせの WHERE 条件を構造化して比較。SOSL の RETURNING の項目・オブジェクトの追加                   |
|                                                     | 式                                                        | キャスト、instanceof、単項・二項演算、三項演算子、配列の添字、`new`（Map / Set / 配列）                                                                                           |
| `AccountTrigger.trigger`                            | 対象イベント・本文                                        | `triggerCase` は集合（`after update` は unchanged）。条件式は型付き構造で比較し、`Trigger.isBefore` と追加された `Trigger.isInsert` を含む `&&` の式を示す                        |
| `script.apex`                                       | 匿名 Apex                                                 | field・メソッドはキー対応、文は GumTree。`System.debug('end')` の移動、for の中の if への文の追加                                                                                 |
| `Broken.cls`                                        | 構文エラーの発生                                          | 構文エラー 2 件の発生（resolvedError）。差分の木にエラーのノードは出ない                                                                                                          |
| `Level.cls`                                         | enum 定数の追加                                           | `MEDIUM` の added（順序付き列）                                                                                                                                                   |
| `Shape.cls`                                         | interface → abstract class                                | kind が変わるので宣言を丸ごと changed                                                                                                                                             |
| `Unchanged.cls`                                     | 空行の追加だけ                                            | 単位も中身も unchanged                                                                                                                                                            |
| `OldHelper.cls` / `NewHelper.cls`                   | before / after の片方だけにある                           | 単位（`class_OldHelper` / `class_NewHelper`）の removed / added（ソースと -meta.xml をまとめて）                                                                                  |
| `AccountService.cls-meta.xml`                       | API バージョン 59.0 → 61.0                                | `apexClassMeta` の `apiVersion` の changed                                                                                                                                        |
| `AccountTrigger.trigger-meta.xml`                   | 無効化と管理パッケージの追加                              | `apexTriggerMeta` の `status`（Active → Inactive）の changed、`packageVersions` の added                                                                                          |
| `Broken.cls-meta.xml`                               | 閉じタグの書き間違い                                      | 単位の `meta.meta` が `null` に変わり（値ごとの changed）、resolvedError（`XML_SYNTAX`）が増える                                                                                  |
| `Unchanged.cls-meta.xml`                            | 変更なし                                                  | unchanged                                                                                                                                                                         |
| `OldHelper.cls-meta.xml` / `NewHelper.cls-meta.xml` | before / after の片方だけにある                           | 単位（`class_OldHelper` / `class_NewHelper`）の removed / added（ソースと -meta.xml をまとめて）                                                                                  |
