# json-output 評価レポート

対象: [docs/examples/apex-ir/json-output](examples/apex-ir/json-output) の 3 ファイル（生成スクリプト: [generate-json-output.ts](examples/apex-ir/generate-json-output.ts)）を、入力元サンプル（[ParserTest.cls](examples/apex-ir/ParserTest.cls) / [ParserTrigger.trigger](examples/apex-ir/ParserTrigger.trigger) / [parser.apex](examples/apex-ir/parser.apex)）と突き合わせて評価した。

| ファイル                | syntaxErrors | conversionErrors | 状態               |
| ----------------------- | ------------ | ---------------- | ------------------ |
| ParserTest.json.json    | 0            | 0                | 修正後に再生成済み |
| ParserTrigger.json.json | 0            | 0                | 修正後に再生成済み |
| parser.json.json        | 0            | 0                | 修正後に再生成済み |

以下の第 1〜3 章は修正前の出力評価であり、第 1 章の具体的な不具合は今回修正した。JSON 生成段階の回帰テストを追加し、生成物も再出力している。

## 対応結果

- SOQL の LIMIT / OFFSET、`inherited sharing`、日付式の引数値を修正した。`LAST_N_DAYS_N` などの `funcName` 表記は IR の内部名を維持しており、出力 API としての命名は未決。
- 空の `return;`、初期化・条件・更新式を省略した `for (;;)`, 空の制御ブロックを保持するよう修正した。
- finally 節が存在しない場合に空の finally を出力しないようにし、明示的な空 finally は保持する。
- 配列アクセスを `arrayAccess` ノードにし、配列 / クラス / Map / Set creator を `creatorType` で区別する。空配列・空 Set の初期化子も明示する。
- `exceptionType` / `externalKey` / `ternary` / `trueValue` のキー名を修正した。
- JSON 生成段階の回帰テストを追加した。全テスト 134 件が成功。

## 1. 修正前に確認した誤り・欠落

### 1-1. `OFFSET` が `limit` に上書きされる（対応済み）

ParserTest `basicSoql()`:

```apex
... LIMIT 100 OFFSET 10
... LIMIT :pageSize OFFSET :pageOffset
```

出力:

```json
"limit": { "kind": "number", "value": "10" }                        // 100 が消失、offset なし
"limit": { "kind": "bind", "value": { "kind": "id", "value": "pageOffset" } }  // pageSize が消失
```

原因: [query/soql.ts](../src/analyzer/types/apex/query/soql.ts#L86) で `soqlType.limit = offsetField;` としている（`soqlType.offset` が正）。SOSL の fieldSpec 側（`Lead(... OFFSET 5)`）は正しく `offset` に出力されている。

### 1-2. `inherited sharing` が欠落（対応済み）

ParserTest のクラス宣言 `global inherited sharing virtual class ParserTest` の `modifier` に `sharing` がない。

```json
"modifier": { "annotation": {...}, "access": ["GLOBAL"], "declaration": ["VIRTUAL"] }
```

原因: IR は `'INHERITED_SHARING'`（[modifierVisitor/normal.ts](../src/analyzer/types/apex_IR/modifierVisitor/normal.ts#L82)）を返すが、[modifier.ts](../src/analyzer/types/apex/modifier.ts#L12) は `'INHERIT_SHARING'` を期待しており一致しない。`without sharing`（内部クラス）は正しく出力されている。

### 1-3. `LAST_N_DAYS:30` の引数値が失われる（引数値は対応済み）

```json
{
    "kind": "dateFormula",
    "funcName": "LAST_N_DAYS_N",
    "param": { "value": "LAST_N_DAYS_N", "valueType": "integer" }
}
```

`param.value` が `"30"` ではなく関数名になっている。原因: [query/common.ts](../src/analyzer/types/apex/query/common.ts#L118) で `const literal = valueValue.getValue();` としている（`param.getValue()` が正）。また `funcName` が文法トークン名 `LAST_N_DAYS_N` のままで、ソース上の `LAST_N_DAYS` と一致しない点も要検討。

引数値は `param.getValue()` を読むよう修正した。`funcName` の外部表記は引き続き設計判断が必要。

### 1-4. 文がまるごと欠落する（対応済み）

ParserTest `controlFlow()` は 10 文あるが出力は 8 文。以下 2 文が消えている。

| ソース                    | 推定原因                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `if (value == 0) return;` | 値なし `return;` は `makeExpressionType` が `undefined` → 文が `undefined` → [if.ts](../src/analyzer/types/apex/statement/if.ts#L23) で分岐が捨てられ、if 文自体が消える |
| `for (;;) { break; }`     | [for.ts](../src/analyzer/types/apex/statement/for.ts#L66) が `cond && updates.length > 0` を必須とし、init も必須のため、条件/更新/初期化のいずれかが空の for は消える   |

同じ理由で、以下も消えると考えられる（サンプル外だが実コードで頻出）。

- `return;` 単体の文（void メソッドの早期 return）
- 空ブロック `{}` を本体に持つ if / for / while（`makeBlockField` が空配列で `undefined` を返すため）
- `for (Integer i = 0; i < n;)` のような更新式なし for

### 1-5. 存在しない `finally` が出力される（対応済み）

ParserTrigger の `try { ... } catch (Exception e) { ... }`（finally なし）に `{"type":"finally","block":[]}` が付く。parser.apex / ParserTest でも finally なしの try があれば同様。

原因: [try.ts](../src/analyzer/types/apex/statement/try.ts#L63-L71) の `if (finallyBlock)` は配列なので常に真。`length > 0` で判定すべき（try 本体側の判定も同様）。

### 1-6. 配列添字アクセスが `kind` を持たない（対応済み）

```apex
names[0] = 'Bob';
Integer value = numbers[0];
```

```json
"left": [ { "kind": "id", "value": "names" }, { "kind": "literal", "value": "0", ... } ]
"initValue": [ { "kind": "id", "value": "numbers" }, { "kind": "literal", ... } ]
```

式なのに素の配列で出力され、`kind` による判別ができない。`{ "kind": "arrayAccess", "object": ..., "index": ... }` のような形が望ましい。

### 1-7. 配列生成とクラス生成が区別できない（対応済み）

| ソース                      | 出力                                                                   |
| --------------------------- | ---------------------------------------------------------------------- |
| `new Integer[] { 1, 2, 3 }` | `{"kind":"instance","typeName":["Integer"],"initValue":[...]}`         |
| `new Integer[] {}`          | `{"kind":"instance","typeName":["Integer"]}`（`new Integer()` と同形） |
| `new String[10]`            | `{"kind":"instance","typeName":["String"],"size":...}`                 |
| `new List<String>[2]`       | `{"kind":"instance","typeName":["List"],"generic":[...],"size":...}`   |
| `new Set<String>{}`         | `new Set<String>()` と同形                                             |

配列であること・初期化子の有無を示すフィールドがない。

### 1-8. typo（対応済み）

| キー                          | 正                                   |
| ----------------------------- | ------------------------------------ |
| `excepstionType`（catch）     | `exceptionType`                      |
| `eternalKey`（upsert）        | `externalKey`                        |
| `tenary`（三項演算子の kind） | `ternary`                            |
| `truevalue`                   | `trueValue`（`falseValue` と不揃い） |

---

## 2. 表現の不統一

JSON を消費する側（viewer / MCP / 依存解析）が分岐を増やす原因になる。

| 項目                       | 現状                                                                                              | 備考                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 判別キー                   | 多くは `kind`、for / while / doWhile は `type`、try の各節・property の getter/setter も `type`   | `kind` に統一したい                                          |
| try の構造                 | 外側 `kind: "try"`、内側 `type: "try" \| "catch" \| "finally"`                                    | 同上                                                         |
| else 表現                  | if は `condition: "else"`（文字列）、switch は `conditionValue: {"value":"else"}`（オブジェクト） |                                                              |
| switch の `conditionValue` | 値列挙は配列、型パターン（`when Account a`）と else は単一オブジェクト                            | 型パターンの `valueType` だけ型オブジェクト                  |
| 戻り値型                   | `void` は文字列 `"void"`、それ以外は型オブジェクト                                                |                                                              |
| `void.class`               | `{"kind":"void","value":"void.class"}`、他のクラスリテラルは `{"kind":"type","value":<型>}`       |                                                              |
| 名前                       | method は `name: string`、constructor は `name: string[]`                                         |                                                              |
| 初期化子キー               | Map / 配列は `initValue`、List / Set は `initialValue`                                            |                                                              |
| this / super 呼び出し      | `this.hook()` は `object: {"kind":"this"}`、`this('x')` / `hook()` は `isThis` / `isSuper` フラグ | 修飾なし呼び出しだけ `isSuper:false,isThis:false` が付く     |
| メンバーの `kind`          | anonymous / trigger のブロック内メンバーには `kind` あり、クラス内（`method[]` 等）にはなし       |                                                              |
| SOQL WHERE                 | 単一条件は配列、複合条件は `{logicalOperator, conditions}`                                        |                                                              |
| SOQL 数値                  | LIMIT は `kind:"number"`、WHERE / HAVING の整数は `kind:"integer"`                                |                                                              |
| `FIELDS(ALL)`              | `arg: "ALL"`（文字列）、他の関数は `arg: string[]` / オブジェクト                                 |                                                              |
| DATA CATEGORY              | SOQL は `with.categories`、SOSL は `with[].param`                                                 |                                                              |
| `ALL ROWS`                 | `"allRows": "ALL ROWS"`（文字列）                                                                 | boolean が自然                                               |
| break / continue           | `{"kind":"continue","block":"continue"}`                                                          | `block` が冗長                                               |
| 式文                       | `{"kind":"expression","block":{"kind":"expression",...}}`                                         | 文と二項演算式が同じ `kind` 名、単一式なのにキー名が `block` |

---

## 3. 情報損失（設計判断として要確認）

- **位置情報がない**: `span` / 行番号が一切出力されない。解析結果をソースへ逆引きする用途（viewer・MCP）では必要になる可能性が高い。
- **宣言順の喪失**: クラスは `field` / `property` / `construct` / `method` / `class` / `enum` / `interface` に分類されるため、元の宣言順が失われる（anonymous / trigger は順序保持）。
- **SOQL SELECT の並べ替え**: [select.ts](../src/analyzer/types/apex/query/select.ts#L98-L117) で `field` / `soqlFunction` / `typeOf` / `subQuery` を分離してソートしている。正規化としては有用だが、元の列順・関数とフィールドの混在順は復元できない（例: `SELECT Industry, COUNT(Id), AVG(...)` → `AVG` が `COUNT` より前）。
- **anonymous の変数が `field`**: parser.apex のトップレベル変数（`Id accountId;` 等）は `kind:"field"`。匿名 Apex では意味的にローカル変数であり、トリガー / メソッド内（`localVariable`）と揃わない。
- **sObject コンストラクタ引数**: `new Account(Name = 'X')` が代入式 `{"kind":"expression","left":{"kind":"id","value":"Name"},"operator":"="}` として表現される。フィールド参照として抽出するには消費側で特別扱いが必要。
- **SNIPPET**: `WITH SNIPPET (target_length = 120)` が `param: "120"` となりキー名 `target_length` が失われる。
- **空の宣言 `;`**: ParserTest の空メンバー宣言は出力されない（実害なし）。

---

## 4. 正しく出力されているもの

ソースと突き合わせて、以下は期待どおりであることを確認した。

- **トリガー**: 名前・対象オブジェクト・7 種の `triggerCase`、`Trigger.*` コンテキスト変数、トリガー内のフィールド / プロパティ / メソッド / クラス / インターフェース / enum
- **クラス宣言**: `extends` / `implements`、アノテーション（`@IsTest(SeeAllData=false isParallel=true)`、`@AuraEnabled(cacheable=true)`、`@InvocableMethod(...)`、`@Deprecated`、`@TestVisible`）とそのカテゴリ分類、`webservice` / `testmethod` / `transient` / `override` / `virtual` / `abstract` / `without sharing`
- **フィールド**: 複数宣言子（`first = 1, second, third = 3`）、多次元配列（`dimension: 2`）、ネストしたジェネリクス
- **静的 / インスタンス初期化子**（`isStatic`）、プロパティ（自動 / setter のアクセス修飾子 / 本体付き）
- **コンストラクタ**: `this(...)` / `super()` 呼び出し
- **式**: 全二項・単項・前置/後置・複合代入演算子、`??`、`?.`、三項、キャスト、`instanceof`、括弧（`sub` + `parenthesized`）、メソッドチェーン、SOQL 結果へのフィールドアクセス
- **リテラル**: string / integer / long（`100L`）/ number / boolean / null、エスケープ文字列
- **制御構文**: if / else if / else、通常 for（宣言 init・式 init・複数更新式）、拡張 for（リスト / SOQL）、while、do-while、switch（文字列 / 整数・負数 / enum / 型パターン / null / else）
- **例外**: 複数 catch、`final` 修飾 catch、finally のみの try、throw
- **DML**: insert / update / upsert（外部 ID）/ delete / undelete / merge と `as user` / `as system`
- **System.runAs**
- **SOQL**: バインド、比較 / 論理演算子（AND / OR / NOT のネスト）、IN / NOT IN / INCLUDES / EXCLUDES、セミジョイン、日付リテラル / 日時 / 通貨、リレーション・サブクエリ・エイリアス、TYPEOF、集計関数・別名、GROUP BY（ROLLUP / CUBE / 関数）、HAVING、ORDER BY（ASC / DESC / NULLS）、日付関数、FORMAT / TOLABEL / convertCurrency（ネスト含む）、FIELDS、DISTANCE / GEOLOCATION（負数含む）、USING SCOPE、WITH（USER_MODE / SYSTEM_MODE / SECURITY_ENFORCED / DATA CATEGORY）、ALL ROWS、FOR UPDATE / VIEW / REFERENCE、UPDATE TRACKING / VIEWSTAT
- **SOSL**: 文字列 / バインドキーワード、IN 句の全グループ、RETURNING（WHERE / ORDER BY / LIMIT / USING LISTVIEW / OFFSET 付き）、WITH 各種、LIMIT、UPDATE

---

## 5. 残る検討事項

1. `LAST_N_DAYS_N` などの日付式内部名を JSON 公開表記としてどう扱うか決める。
2. `kind` / `type`、else、switch 条件、初期化子キーなどの表現を統一するか決める。既存 JSON 利用側との互換性を確認してから変更する。
3. 位置情報（`span` / 行番号）とクラス宣言順を JSON に保持する必要性を決める。
