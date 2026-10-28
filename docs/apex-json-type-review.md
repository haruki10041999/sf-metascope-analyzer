# converter → JSON 型生成（src/analyzer/types/apex）レビュー

対象: [src/analyzer/types/apex](../src/analyzer/types/apex) のうち converter 以外（`commons.ts` / `expression.ts` / `primary.ts` / `type.ts` / `modifier.ts` / `query/*`）

## 1. 検証方法

1. **型チェック**: `npx tsc --noEmit -p .` で `types/apex` 配下のコンパイルエラーを確認。
2. **実データでの型判定**: [docs/examples/apex-ir](examples/apex-ir) の 3 サンプル（`ParserTest.cls` / `ParserTrigger.trigger` / `parser.apex`）を `UnitVisitor` → converter（`assignMultiClass`）→ `makeConvertType` で変換。木の中の各ノードを対応する `makeXxxJson` に通し、出力を typia の `createIs<XxxJson>()` で判定。不一致は `createValidate` で不一致パスを特定した。
3. **情報欠落の確認**: converter ノードと生成 JSON のスカラー値を比較し、型生成で失われた値を検出。

## 2. 結果サマリ

| 観点                            | 修正前                                                         | 修正後         |
| ------------------------------- | -------------------------------------------------------------- | -------------- |
| `types/apex` のコンパイルエラー | 13 件（7 ファイル）                                            | 0 件           |
| 実データでの型判定（46 型）     | 変換途中で例外停止。修正後の初回判定で 14 型が NG              | 46 型すべて OK |
| 型生成での値の欠落              | SOQL の数値リテラル（`1000`, `1.5` 等）が `valueType` に化ける | 0 件           |

型判定の件数（修正後、3 ファイル合計）: `primaryExpression` 649 / `typeRef` 355 / `dotExpression` 182 / `modifier` 103 / `assignExpression` 61 / `value` 45 / `newExpression` 45 / `soqlFunction` 44 / `fromNameList` 43 / `query` 40 / `selectList` 40 ほか、合計 46 型すべて NG 0。

## 3. 型ごとの評価

評価: ◯ 妥当 / △ 動作するが設計上の課題あり / ✕ 修正前は不正（今回修正済み）

### 共通（commons.ts）

| 型 / 関数                         | 評価 | コメント                                                                                                                                                                                           |
| --------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Convert` / `ConvertExcludeError` | ◯    | `sourceInfo` 除去と `objectKey`/`sourceKey` 付与を型で正しく表現。                                                                                                                                 |
| `convertValue`                    | ◯    | エラー除去 → 型判定 → kind 検証の流れは妥当。ただし `kinds` に無い kind を返すと**実行時に throw** するため、kinds の列挙漏れに注意（下記 primary / expression で発生していた）。                  |
| `JsonType` / `StructureJsonType`  | △    | `makeStructureJsonType` は子の `sourceKeys` を親に集約するので、子プロパティの型は `Omit<…, 'sourceKeys'>` にする必要がある。この規約が型側で強制されず、`SoqlJson` などで崩れていた（修正済み）。 |
| `ErrorJson`                       | △    | `Omit<TypeJson \| ErrorJson, 'kind' \| …>` のように **kind を落とすと、エラーが `{kindType}` だけになり識別できない**（type.ts / instanceof / newInstance の generic）。                           |

### expression.ts

| 型                       | 評価 | コメント                                                                                                                                                                          |
| ------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BaseExpressionJson`     | ✕→◯  | primary の出力（`literal` / `type` / `soql` / `sosl`）が union に無く、`kinds` にも無かった。そのため `1` や `String.class` などで実行時に throw していた。`PrimaryJson` を追加。 |
| `DotMethodCallJson`      | ✕→◯  | メソッド呼び出し側で `member` に AnyId ノード（オブジェクト）を入れていた（182 件中 111 件 NG）。`memberArg` も型が `string` なのに実体は式の配列だった。                         |
| `MethodCallJson`         | ◯    | `this(...)` / `super()` も含め妥当。                                                                                                                                              |
| `NewInstanceJson`        | △    | `generic` が `Omit<…, 'kind'>` のため、エラー要素を識別できない。                                                                                                                 |
| `FormulaJson`            | △    | `operator` の union 末尾に `\| string` があり、リテラル型の列挙が無意味（実質 `string`）。                                                                                        |
| `InstanceofJson`         | △    | kind が `'formula'` で `FormulaJson` と同じなのに形が異なる（`left/right` ではなく `target/type`）。kind だけでは判別できない。                                                   |
| `UnaryJson`              | ◯    | 前置・後置の区別も妥当。                                                                                                                                                          |
| `TernaryJson`            | △    | kind が `'tenary'`（`ternary` の誤字）。                                                                                                                                          |
| `SubJson`                | △    | プロパティ名 `parentheSize`（`parentheses` の誤字）、かつ常に `'()'` で情報量がない。                                                                                             |
| `CastJson` / `ArrayJson` | ◯    |                                                                                                                                                                                   |

### primary.ts / type.ts / modifier.ts

| 型                   | 評価 | コメント                                                                                                                                                                    |
| -------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrimaryJson`        | ✕→◯  | `kinds` が `'typeRef'` だったが `TypeJson` の kind は `'type'`（`.class` で throw）。`soqlPrimary` は `SoqlLiteral` の中の `query` を渡す必要があった。                     |
| `LiteralPrimaryJson` | △    | `valueType` の `'longText'` は converter 型の定義どおり。ただし IR は `'multilineString'` を返す。サンプルに複数行文字列が無く未検証。                                      |
| `TypeJson`           | △    | 判別子が primitive / custom は `type`、配列・コレクションは `collectionType` と不統一。`CustomTypeJson.generic` は型で kind / sourceKeys を除いているが、実体は含んでいる。 |
| `ModifiersJson`      | ◯    | 修飾子・注釈の分類と `sourceKeys` の対応は妥当。                                                                                                                            |

### query/*

| 型                               | 評価 | コメント                                                                                                                                                                                   |
| -------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SoqlJson` / `SubQueryJson`      | ✕→◯  | 子プロパティに `sourceKeys` が残る型だったため、全件 NG（40 / 3 件）。`Omit<…, 'sourceKeys'>` に修正。                                                                                     |
| `SelectJson`                     | △    | 種類別（field / soqlFunction / …）にまとめるため、**SELECT 句の並び順が失われる**。`alias` が型に宣言されていない（実体にはある）。                                                        |
| `FromJson`                       | △    | FROM が 2 件以上だと `ErrorJson` になる（`FROM Account a, a.Contacts c` のような形を表現できない）。                                                                                       |
| `WhereJson`                      | ◯    | AND / OR / NOT の入れ子、比較演算子、各種値を表現できている。                                                                                                                              |
| `ValueJson`                      | ✕→◯  | `bind` / `subQuery` が `JsonType<'value'>` と別 kind の交差になり、型が `never` になっていた。`{ type, value }` 形式に変更。数値リテラルの `value` に `valueType` を入れていたバグも修正。 |
| `SoqlFunctionJson`               | ◯    | DISTANCE / GEOLOCATION / FORMAT の入れ子まで表現できている。                                                                                                                               |
| `TypeOfJson`                     | ✕→◯  | 必須の `field`（TYPEOF 対象）を設定していなかった。                                                                                                                                        |
| `GroupByJson`                    | ◯    |                                                                                                                                                                                            |
| `OrderByJson`                    | ✕→◯  | 要素の型に `sourceKeys` が残っていた。                                                                                                                                                     |
| `LimitJson` / `OffsetJson`       | ✕→◯  | バインド値の型が `ExpressionJson`（文字列）で、呼び出し先の `makeExpressionJson` が存在しなかった。`BaseExpressionJson` に変更。                                                           |
| `ForJson`                        | △    | FOR が 2 件以上だと `ErrorJson`。                                                                                                                                                          |
| `UsingScopeJson`                 | ✕→◯  | `value` に SoqlId ノードを入れていた。                                                                                                                                                     |
| `WithJson`                       | ✕→◯  | DATA CATEGORY / 条件の子に `sourceKeys` が残る型だった。                                                                                                                                   |
| `SoslWithJson`                   | ✕→◯  | DIVISION / PRICEBOOKID の実体が型の `{type:'literal'\|'bind', value}` 形式になっていなかった。                                                                                             |
| `SoslJson`                       | ✕→◯  | `group` に searchGroup ノードを入れていた。`update` の型が配列だった。FIND の正規表現が `[` の直後の改行に対応しておらず、2 件で例外。                                                     |
| `UpdateListJson` / `AllRowsJson` | ◯    |                                                                                                                                                                                            |

## 4. 修正内容

| ファイル                                                                                                                                                                                                                                                               | 修正                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [expression.ts](../src/analyzer/types/apex/expression.ts)                                                                                                                                                                                                              | `makeExpressionJsonConvert` に不足していた `errorKind` 引数を追加（コンパイルエラーの原因）。引数を `ConvertType` に変更。`BaseExpressionJson` と kinds に primary 出力を追加。`DotMethodCallJson` の `member` / `memberArg` を修正。`omitSourceKeys` の型制約を緩和。 |
| [primary.ts](../src/analyzer/types/apex/primary.ts)                                                                                                                                                                                                                    | kinds の `'typeRef'` → `'type'`。`soqlPrimary` は `target.value.value` を渡すよう修正。                                                                                                                                                                                |
| [index.ts](../src/analyzer/types/apex/index.ts)                                                                                                                                                                                                                        | 削除済みの `./unit` の export を除去。                                                                                                                                                                                                                                 |
| [query/commons.ts](../src/analyzer/types/apex/query/commons.ts)                                                                                                                                                                                                        | `makeSignedNumberJson` の `value` の取り違えを修正。`ValueJson` の bind / subQuery を `{ type, value }` 形式に変更。                                                                                                                                                   |
| [query/soql.ts](../src/analyzer/types/apex/query/soql.ts), [query/subQuery.ts](../src/analyzer/types/apex/query/subQuery.ts), [query/orderBy.ts](../src/analyzer/types/apex/query/orderBy.ts)                                                                          | 子プロパティの型を `Omit<…, 'sourceKeys'>` に修正。                                                                                                                                                                                                                    |
| [query/with.ts](../src/analyzer/types/apex/query/with.ts)                                                                                                                                                                                                              | `WithJson` の子の型を修正。`SoslWithJson` の DIVISION / PRICEBOOKID を型どおりの形で出力。                                                                                                                                                                             |
| [query/sosl.ts](../src/analyzer/types/apex/query/sosl.ts)                                                                                                                                                                                                              | `group` に値を設定。`update` の型を単体に修正。FIND の正規表現を改行・大文字小文字に対応させ、一致しない場合は元の文字列にフォールバック。                                                                                                                             |
| [query/typeof.ts](../src/analyzer/types/apex/query/typeof.ts)                                                                                                                                                                                                          | `field` を設定。                                                                                                                                                                                                                                                       |
| [query/usingScope.ts](../src/analyzer/types/apex/query/usingScope.ts)                                                                                                                                                                                                  | `value` に識別子文字列を設定。                                                                                                                                                                                                                                         |
| [query/limit.ts](../src/analyzer/types/apex/query/limit.ts), [query/offset.ts](../src/analyzer/types/apex/query/offset.ts), [query/soqlFunction.ts](../src/analyzer/types/apex/query/soqlFunction.ts), [query/allRows.ts](../src/analyzer/types/apex/query/allRows.ts) | 存在しない `makeExpressionJson` を `makeExpressionJsonConvert` / `BaseExpressionJson` に置換（allRows は未使用 import の削除）。                                                                                                                                       |
| [converter/query.ts](../src/analyzer/types/apex/converter/query.ts)                                                                                                                                                                                                    | `COUNT()`（引数なし）で `null` を扱うルールが無く、converter が例外で停止していた。型定義（`FieldNameType \| null`）に合わせて `makeNullAssignRule` を追加。                                                                                                           |

## 5. 未対応の指摘（判断が必要なもの）

### エラー・不整合

- **`types/index.ts` の名前衝突（178 件）**: `./apex`（converter の型版）と `./apex_IR`（クラス版）が、同じ名前の `isXxxType` を公開している。`export *` 同士の衝突で、これらの名前は `types` からは import できない。今回は方針により変更していない。
- **テストと実装の不一致**: テストが読み込み段階で停止し、1 件も実行されない。
    - [modifier-json.test.ts](../test/converter/modifier-json.test.ts) が存在しない `makeAllModifierJson` を import している（実装は `makeModifiersJson`）。
    - [examples.test.ts](../test/converter/examples.test.ts) が削除済みの `types/apex/unit` を import している。
    - [generate-converter-output.ts](examples/apex-ir/generate-converter-output.ts) が存在しない `makeCompilationUnitRule` / `ErrorInfo` / `extractSourceInfo` を参照している。
- **`parser/Apex` のエラー（13 件）**: 削除済みの `types/apex/statement` などを参照している。今回の対象外。

### 設計上の課題

1. **`sourceKeys` の持ち方が 3 通りある**: 構造型は親へ集約、式の子は削除（`omitSourceKeys`）、`LimitJson` / `ValueJson` などの bind は子が保持。どれかに統一しないと、`restoreJson` / `regenerateSourceObjects` で辿れない箇所ができる。
2. **kind の重複と命名**: `methodCall`（フィールド参照も含む）、`formula`（instanceof も含む）、`tenary` / `parentheSize` の誤字。
3. **エラーの識別性**: `Omit<…, 'kind'>` でエラーの kind が消える箇所がある。
4. **SELECT 句の順序消失**、**FROM / FOR が複数あるとエラー扱い**。
5. typia の `createIs` は余分なプロパティを許すため、今回の検証では「型に無いプロパティが出力にある」ことは検出していない（`createEquals` で検証すると、`alias` などで差分が出る）。
