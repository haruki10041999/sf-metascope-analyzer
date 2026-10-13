# apex IR / converter 出力評価と修正

対象: [docs/examples/apex-ir](examples/apex-ir) の 3 サンプル（`ParserTest.cls` / `ParserTrigger.trigger` / `parser.apex`）

- IR 出力: `npx tsx docs/examples/apex-ir/generate-ir.ts` → `ir-output/*.ir.json`
- converter 出力: `npx tsx docs/examples/apex-ir/generate-converter-output.ts` → `converter-output/*.converted.json`
- テスト: `npm test`

## 評価方法

1. `npm test` を実行し、既存テストの合否を確認。
2. IR JSON と converter JSON に含まれるスカラー値（識別子・リテラル・演算子・キーワード）を多重集合として比較し、IR にあって converter にない値を「欠落」として検出（`type` / `valueType` / `span` などの構造キーは除外）。
3. 欠落箇所を converter 出力から辿り、原因となる変換関数・クラスを特定。

## 評価結果（修正前）

### IR

| 項目                 | 結果                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| 3 サンプルの IR 生成 | 構文エラー・IR エラーなし。再生成しても出力に変化なし                                          |
| テスト               | 122 件中 1 件失敗（`statement.test.ts`「when リテラルの符号はソース順に保持される」）          |
| 失敗原因             | IR は `whenLiteral.value` を文字列（`'1'`）で保持する実装だが、テストが旧仕様の数値 `1` を期待 |

IR 実装自体は正しく、テストとドキュメント（[literalVisitor.md](apex-ir-types/literalVisitor.md)）が旧仕様のままでした。

### converter

変換エラー（`conversionErrors`）は 0 件でしたが、変換結果から大量の値が欠落していました。

| ファイル                | 欠落値の種類（修正前） | 主な欠落内容                                                                                       |
| ----------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| `ParserTest.cls`        | 66                     | フィールド名・初期値、`implements`、クラスの注釈・修飾子、if/for 本体、merge 対象、GROUP BY/HAVING |
| `ParserTrigger.trigger` | 74                     | トリガー名、トリガー内のメンバー宣言（全件 `value: null`）、if/for 本体                            |
| `parser.apex`           | 149                    | トップレベル変数の変数名・初期値（全件 `value: []`）、if/for/while 本体                            |

converter のテストは存在しませんでした。

## 原因と修正内容

| #   | ファイル                                                                      | 原因                                                                                                                                                | 修正                                                                               |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | [declaration.ts](../src/analyzer/types/apex/converter/declaration.ts)         | `FieldDeclarationClass.setValue` が `this.value` ではなく引数自身に push しており、フィールド（匿名 Apex のトップレベル変数を含む）の宣言子が常に空 | `this.value.push(...value)` に修正                                                 |
| 2   | [declaration.ts](../src/analyzer/types/apex/converter/declaration.ts)         | `classDeclarationConvert` が `implement` を `getExtend()` から読んでいた                                                                            | `getImplement()` に修正                                                            |
| 3   | [declaration.ts](../src/analyzer/types/apex/converter/declaration.ts)         | `typeDeclarationConvert` が修飾子・注釈を集めているのに設定していなかった                                                                           | `typeDeclaration.setModifier(modifiers)` を追加                                    |
| 4   | [declaration.ts](../src/analyzer/types/apex/converter/declaration.ts)         | `isMethodDeclarationClassArray` が `isMemberDeclarationClass` で判定していた                                                                        | `isMethodDeclarationClass` に修正                                                  |
| 5   | [block.ts](../src/analyzer/types/apex/converter/block.ts)                     | `getterConvert` が集めた文を捨てて常に `[]` を返していた                                                                                            | `values` を返すよう修正                                                            |
| 6   | [statement.ts](../src/analyzer/types/apex/converter/statement.ts)             | `normalStatementConvert` が `isStatementTypeAll` のみで判定しており、`NormalBlockTypeClass`（`{ ... }`）を受け付けず if/for/while 本体が `null`     | 判定に `isNormalBlockType` を追加                                                  |
| 7   | [statement.ts](../src/analyzer/types/apex/converter/statement.ts)             | `mergeStatementConvert` が変換した値を設定していなかった（`getValue()` を呼ぶだけ）                                                                 | `mergeStatement.setValue(values)` に修正                                           |
| 8   | [statement.ts](../src/analyzer/types/apex/converter/statement.ts)             | throw 文に `returnStatementConvert`、continue 文に `breakStatementConvert` を流用していた（結果は同じだが型・意図が不一致）                         | `throwStatementConvert` / `continueStatementConvert` を使用                        |
| 9   | [member.ts](../src/analyzer/types/apex/converter/member.ts)                   | `triggerBlockMemberConvert` が匿名 Apex 用の `isAnonymousMemberDeclarationType` で判定しており、トリガー内の宣言がすべて破棄されていた              | `isTriggerMemberDeclarationType` / `triggerMemberDeclarationConvert` に修正        |
| 10  | [unit.ts](../src/analyzer/types/apex/converter/unit.ts)                       | `TriggerUnitClass.value` が単一文字列で、トリガー名が対象 SObject 名で上書きされていた                                                              | 仕様（[apex-converter-types.md](apex-converter-types.md)）どおり `string[]` に変更 |
| 11  | [query.ts](../src/analyzer/types/apex/converter/query.ts)                     | `NormalQueryClass.copy` が `groupByClause` をコピーしておらず GROUP BY / HAVING が消失。ゲッター名も `getGroupeByClause` と誤記                     | `copy` に追加し、`getGroupByClause` に改名                                         |
| 12  | [clause.ts](../src/analyzer/types/apex/converter/clause.ts)                   | `isFieldGroupBy` が `isStringArray(...) && isSoqlFunctionClass(...)` で常に false                                                                   | `\|\|` に修正                                                                      |
| 13  | [generate-converter-output.ts](examples/apex-ir/generate-converter-output.ts) | 出力がクラスインスタンスになったため、JSON 化を明示的に行うよう変更                                                                                 | `CommonClass` を plain object に変換する replacer を追加                           |

IR 側の修正:

| ファイル                                               | 修正                                                                                    |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [statement.test.ts](../test/apex_IR/statement.test.ts) | `whenLiteral` の期待値を `'1'`（文字列）に更新                                          |
| [literalVisitor.md](apex-ir-types/literalVisitor.md)   | `WhenLiteralTypeClass` の `value` / `operator` / 例を現行実装（文字列値・`null`）に更新 |

## テスト追加

[test/converter/examples.test.ts](../test/converter/examples.test.ts) を新規作成。

- 3 サンプルが変換エラーなしで変換でき、IR のスカラー値を 1 つも欠落させないこと（上記の評価方法 2 をテスト化）
- フィールド宣言子、トップレベル修飾子・`implements`、getter 本体、merge 対象、GROUP BY（ROLLUP）、ブロック文、トリガー名・トリガー内宣言の個別回帰テスト

## 評価結果（修正後）

| 項目                    | 結果                                |
| ----------------------- | ----------------------------------- |
| `npm test`              | 130 件すべて成功（追加 8 件を含む） |
| converter の変換エラー  | 0 件                                |
| IR → converter の値欠落 | 0 件（3 ファイルとも）              |

比較で残る差分は、IR の `arraySubscripts.value = 0`（配列でない型）と、メンバー宣言の `isStatic = false` の 2 種類です。converter はこれらを意図的に `dimension: null` / `isStatic: null` に正規化しているため、欠落には当たりません。

## 未対応の指摘（仕様判断が必要なもの）

- `ClassDeclarationClass.extend` は継承がない場合も空の `TypeRef`（`{"value":[],"dimension":null}`）を出力する。「継承なし」と区別しづらいため、`TypeRef | null` にするか検討の余地がある。
- [apex-converter-types.md](apex-converter-types.md) では `TriggerUnit` のキー名が `triggerCase` だが、実装（`TriggerUnitClass`）は `triggerCaseType`。JSON のキー名が変わるため今回は変更していない。

---

# サンプル Apex（テストコード）の表現網羅性評価

サンプル Apex 3 ファイルに書かれた表現が、IR JSON・converter JSON のそれぞれに漏れなく表現されているかを評価した。

## 評価方法

1. **トークン照合**: `ApexLexer` でソースをトークン化し（空白・コメントを除く）、各トークンのテキストが JSON のスカラー値に出現するかを多重度込みで照合。完全一致しないものは、大文字小文字の違い、他の値の一部としての出現（例: `FIND` → `"[FIND 'test'"`）、出現なしの 3 段階に分類した。
2. **付帯情報の件数比較**: `valueType` / `operator` / `alias` / `direction` / `nulls` / `mode` / `accessLevel` の値ごとの件数を IR と converter で比較。
3. **構文要素の目視確認**: 照合で「出現なし」になったトークンについて、該当箇所の JSON を抜き出し、ノード種別（`type`）やキーで表現されているかを確認。
4. **演算子・ノード種別の集計**: converter JSON 中の `operator` と `type` の種類を集計し、ソースの全演算子・全文種別が区別されているかを確認。

## 結果サマリ

| 観点                                       | IR                               | converter                                     |
| ------------------------------------------ | -------------------------------- | --------------------------------------------- |
| 識別子・リテラル・型名                     | 全件出現                         | 全件出現                                      |
| 演算子（算術・ビット・代入・比較・論理等） | 全種類を区別                     | 全種類を区別                                  |
| 文の種類                                   | 全種類をノード種別で区別         | 全種類を `type` で区別                        |
| SOQL / SOSL 句                             | 全句をノード種別・キーで表現     | 全句をキーで表現                              |
| 付帯情報（`valueType` 等）                 | 全件保持                         | **1 件欠落 → 修正済み**                       |
| 「出現なし」トークン                       | 構文記号・キーワードのみ（後述） | IR と完全に同一（converter での追加欠落なし） |

## トークン照合で「出現なし」となったもの

いずれも構文上の記号・キーワードで、値としてではなくノード種別やキーで表現されている。情報の欠落ではない。

| トークン                                                             | JSON での表現                                                                            |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `(` `)` `{` `}` `[` `]` `;` `,` `=>`                                 | 木構造そのもの（配列・入れ子）。`=>` は Map 初期化子の `left` / `right`                  |
| `class` `interface` `enum` `extends` `implements`                    | `type: "class"` 等、`extend` / `implement` キー                                          |
| `return` `if` `while` `switch` `when` `catch` `throw` `finally` など | 文の `type`（`return` / `if` / `while` / `switch` / `try` …）と `catchBlock` 等のキー    |
| `merge` `upsert` `delete` `undelete`                                 | 文の `type`                                                                              |
| `System.runAs`                                                       | `type: "runAs"`                                                                          |
| `SELECT` `FROM` `WHERE` `ORDER BY` `GROUP BY` `HAVING` `LIMIT` など  | `from` / `whereClause` / `orderByClause` / `groupByClause` / `having` / `limitClause` 等 |
| `TYPEOF` `WHEN` `THEN` `ELSE` `END`                                  | `typeOf` の `whenClause` / `elseClause`                                                  |
| `USING SCOPE` `RETURNING` `LISTVIEW`                                 | `usingScope` / `fieldSpecList` / `listView`                                              |
| `convertCurrency` `GEOLOCATION`                                      | 正規化後の値（`CONVERT_CURRENCY`）、`DISTANCE` の `param` 内の座標ペア                   |
| `target_length`                                                      | `WITH SNIPPET` の固定キーワード。`{"value":"SNIPPET","content":"120"}`                   |

## 個別に確認した表現

| ソースの表現                                             | converter JSON での表現                                          | 評価 |
| -------------------------------------------------------- | ---------------------------------------------------------------- | ---- |
| `?.` `<>` `===` `!==` `>>>=` `??` `instanceof`           | `operator` にそのまま保持                                        | OK   |
| `String.class` / `List<String>.class` / `void.class`     | `typeRef` primary / `"void.class"`                               | 注 1 |
| `Integer[][]` / `List<String>[]`                         | `dimension: 2` / array creator の `size`                         | OK   |
| `this('default')` / `super()`                            | `methodCall` の `reference: "this"` / `"super"`                  | OK   |
| `if (value == 0) return;`（波括弧なし）                  | `block` に単文の `return`                                        | OK   |
| `for (;;)` / `for (k = 0; …)` / 拡張 for                 | `value` / `init` / `update` の有無で区別                         | 注 2 |
| `get; private set;`                                      | `setter` の `modifier: [PRIVATE]`                                | OK   |
| `when Account a` / `when else` / `when 1, -1`            | `value` + `valueType` / `value: "else"` / `operator: "-"`        | 注 3 |
| `insert as user` / `upsert … Account.ExternalId__c`      | `accessLevel: "USER"` / `key: ["Account","ExternalId__c"]`       | OK   |
| `@AuraEnabled(cacheable=true)`                           | `annotation.param: [{left:"cacheable", right:{value:"true"}}]`   | OK   |
| SOQL `AND` / `OR` / `NOT` の入れ子                       | `whereClause.value[]` + `operator`（入れ子は再帰）               | OK   |
| `:industry` / `:new Set<Id>()`（バインド）               | `valueType: "boundExpression"` + 式                              | OK   |
| `USD5000` / `2026-01-01T00:00:00Z` / `TODAY`             | `valueType: "integralCurrency"` / `"dateTime"` / `"dateFormula"` | OK   |
| `LAST_N_DAYS:30`                                         | `dateFormula` の `value: "LAST_N_DAYS_N"`、`param: {value:"30"}` | 修正 |
| `-1.5` / `GEOLOCATION(37.775, -122.418)`                 | `signedNumber` の `value: "1.5"`, `operator: "-"`                | OK   |
| `FORMAT(convertCurrency(AnnualRevenue))`                 | `soqlFunction` の入れ子                                          | OK   |
| `GROUP BY ROLLUP(…)` / `HAVING COUNT(Id) > 10`           | `groupByClause.mode: "ROLLUP"` / `having`                        | OK   |
| `IN (SELECT Id FROM User …)`                             | `valueType: "subQuery"` + サブクエリ                             | OK   |
| SOSL `WITH NETWORK IN (…)` / `WITH DATA CATEGORY … AT …` | `withList` の `value` + `content`                                | OK   |

- 注 1: `String.class` は `typeRef` primary として出力され、`.class` リテラルであることは primary の種別（IR の `typeRefPrimary`）でしか区別できない。converter では `type: "typeRef"` として残っているため区別は可能。
- 注 2: 通常の for と拡張 for がどちらも `type: "for"` で、`value` の形（条件式 / `fromVariant` を持つオブジェクト）で区別する。また `init` は変数宣言なら `{"value":[...]}`、式リストなら `[...]` と形が異なる。情報は保持されているが、利用側で形の判定が必要。
- 注 3: `when else` の `valueType` が空の `TypeRef`（`{"value":[],"dimension":null}`）、初期値なしの変数宣言の `content` が `{"value":null}` になるなど、「値なし」を `null` ではなく空オブジェクトで表す箇所がある（`extend` と同じ傾向）。

## 修正内容

| ファイル                                                      | 原因                                                                                                                 | 修正                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [literal.ts](../src/analyzer/types/apex/converter/literal.ts) | `signedIntegerConvert` が `valueType` を `setOperator` に渡しており、`LAST_N_DAYS:30` 等の `valueType` が常に `null` | `setValueType` に修正                  |
| [examples.test.ts](../test/converter/examples.test.ts)        | 値欠落テストが `valueType` を比較対象外にしていたため、上記を検出できなかった                                        | `valueType` も比較対象に含めるよう変更 |

修正後、`npm test` は 130 件すべて成功。setter とゲッターの名前が食い違う呼び出し（`setX(target.getY())`）を converter 全体で検索したところ、残りは `setIsConvertTimeZone(target.getConvertTimeZone())` の 1 件のみで、これは正しい対応である。

## 結論

- **IR**: サンプル Apex の全表現を、値またはノード種別として網羅している。欠落なし。
- **converter**: IR の情報を全件引き継いでいる（`valueType` の 1 件を修正済み）。演算子・文種別・SOQL/SOSL 句もすべて区別されている。
- 残課題は表現形式の一貫性（注 1〜3: 「値なし」の表現、for の `init` の形、`.class` リテラルの区別）で、情報の欠落ではない。いずれも JSON の形が変わるため、仕様判断のうえで対応する。
