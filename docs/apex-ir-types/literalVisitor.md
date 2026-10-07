# literalVisitor

リテラル類（通常リテラル・`switch` の `when` 値・符号付き数値・SOQL/SOSL リテラル）を IR に変換する。プリミティブ系は `valueType` で値の種類を区別する。
子要素の変換に失敗した場合、そのフィールドには `ErrorTypeClass`（`type: 'AnalyzerError'`、`contextType` / `context` / `errorMessage`）が入る。

## Visitor

| visit メソッド        | Context                 | 生成する TypeClass        |
| --------------------- | ----------------------- | ------------------------- |
| `visitLiteral`        | `LiteralContext`        | `NormalLiteralTypeClass`  |
| `visitWhenLiteral`    | `WhenLiteralContext`    | `WhenLiteralTypeClass`    |
| `visitSoslLiteral`    | `SoslLiteralContext`    | `SoslLiteralTypeClass`    |
| `visitSoslLiteralAlt` | `SoslLiteralAltContext` | `SoslLiteralAltTypeClass` |
| `visitSignedInteger`  | `SignedIntegerContext`  | `SignedIntegerTypeClass`  |
| `visitSignedNumber`   | `SignedNumberContext`   | `SignedNumberTypeClass`   |
| `visitSoqlLiteral`    | `SoqlLiteralContext`    | `SoqlLiteralTypeClass`    |

## 基底クラス（base.ts）

### `LiteralTypeClass<T>`

子ノードを持つリテラル（SOQL / SOSL）の基底。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | リテラルの中身                         |

ゲッター: `getValue()`, `getType()`

### `PrimitiveLiteralTypeClass<T>`

値の種類（`valueType`）を伴うプリミティブリテラルの基底。JSON のキー順は `type`, `valueType`, `value`。

| 変数        | 型                    | 内容                                   |
| ----------- | --------------------- | -------------------------------------- |
| `type`      | `string`              | ノード種別（CommonTypeClass から継承） |
| `valueType` | `string`              | 値の種類（各サブクラス参照）           |
| `value`     | `T \| ErrorTypeClass` | リテラル値                             |

ゲッター: `getValue()`, `getValueType()`（戻り値の型は `string | null` だが実際は常に文字列）, `getType()`

### `LiteralAllTypeClass`（型エイリアス）

`LiteralTypeClass<unknown> | PrimitiveLiteralTypeClass<unknown>`。`LiteralVisitor` の戻り値型。

### `isLiteralTypeAll(target)`（ガード関数）

`LiteralTypeClass` または `PrimitiveLiteralTypeClass` のインスタンスなら `true`。

## TypeClass

### `NormalLiteralTypeClass`（normal.ts）

- **type**: `'literal'`
- **継承**: `PrimitiveLiteralTypeClass<string>`
- **元 Context**: `LiteralContext`（文法: `IntegerLiteral | LongLiteral | NumberLiteral | StringLiteral | MultilineStringLiteral | BooleanLiteral | NULL`）
- **役割**: Apex の通常リテラル。値はトークンのテキストのまま文字列で保持する（数値変換や引用符除去はしない）。

| 変数        | 型                         | 内容                                                                                                            |
| ----------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `type`      | `'literal'`                | 継承                                                                                                            |
| `valueType` | `string`                   | `'integer'` \| `'long'` \| `'number'` \| `'string'` \| `'multilineString'` \| `'boolean'` \| `'null'`           |
| `value`     | `string \| ErrorTypeClass` | トークンのテキスト（文字列リテラルは引用符込み、`null` リテラルは文字列 `'null'`）。`create` 経由では常に文字列 |

ゲッター: `getValue()`, `getValueType()`

例:

```apex
public static final Integer MAX_SIZE = 100;
```

```json
{"type":"literal","valueType":"integer","value":"100"}
{"type":"literal","valueType":"null","value":"null"}
```

### `WhenLiteralTypeClass`（whenLiteral.ts）

- **type**: `'whenLiteral'`
- **継承**: `PrimitiveLiteralTypeClass<WhenLiteralValueType>`
- **元 Context**: `WhenLiteralContext`（文法: `(SUB|ADD)* IntegerLiteral | (SUB|ADD)* LongLiteral | StringLiteral | MultilineStringLiteral | NULL | qualifiedName | LPAREN whenLiteral RPAREN`）
- **役割**: `switch` の `when` 節に書かれる値 1 つ。`WhenLiteralValueType` = `number | string | null | QualifiedNameTypeClass | WhenLiteralTypeClass`。

| 変数        | 型                                       | 内容                                                                                                                                                                                                                                                               |
| ----------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`      | `'whenLiteral'`                          | 継承                                                                                                                                                                                                                                                               |
| `valueType` | `string`                                 | `'integer'` \| `'long'` \| `'string'` \| `'multilineString'` \| `'qualifiedName'` \| `'whenLiteral'` \| `'null'`                                                                                                                                                   |
| `value`     | `WhenLiteralValueType \| ErrorTypeClass` | integer / long: `parseInt` した `number`（符号は含まない）。string: 引用符込みのテキスト。multilineString: ソースのままのテキスト（改行も保持）。qualifiedName: `QualifiedNameTypeClass`（列挙値など）。whenLiteral: 括弧内の `WhenLiteralTypeClass`。null: `null` |
| `operator`  | `string`                                 | 数値の前の符号（`+` / `-` トークンをすべてソース順に連結した文字列。例: `-1` → `'-'`、`+-1` → `'+-'`）。符号なし・数値以外は `''`                                                                                                                                  |

ゲッター: `getValue()`, `getValueType()`, `getOperator()`

例:

```apex
when 'A' { ... }
when 1, -1 { ... }
when AAA, BBB { ... }
when null { ... }
```

```json
{"type":"whenLiteral","valueType":"string","value":"'A'","operator":""}
{"type":"whenLiteral","valueType":"integer","value":1,"operator":"-"}
{"type":"whenLiteral","valueType":"qualifiedName","value":{"type":"qualifiedName","value":[{"type":"id","value":"AAA"}]},"operator":""}
{"type":"whenLiteral","valueType":"null","value":null,"operator":""}
```

### `SignedIntegerTypeClass`（signedInteger.ts）

- **type**: `'signedInteger'`
- **継承**: `PrimitiveLiteralTypeClass<string>`
- **元 Context**: `SignedIntegerContext`（文法: `(ADD | SUB)? IntegerLiteral`）
- **役割**: 符号付き整数。SOQL の日付リテラル `LAST_N_DAYS:n` などの `n` に使われる。

| 変数        | 型                | 内容                                          |
| ----------- | ----------------- | --------------------------------------------- |
| `type`      | `'signedInteger'` | 継承                                          |
| `valueType` | `string`          | 常に `'integer'`                              |
| `value`     | `string`          | `IntegerLiteral` のテキスト（符号は含まない） |
| `operator`  | `string \| null`  | `'+'` \| `'-'`。符号なしは `null`             |

ゲッター: `getValue()`, `getValueType()`, `getOperator()`

例:

```apex
AND CreatedDate = LAST_N_DAYS:30
```

```json
{ "type": "signedInteger", "valueType": "integer", "value": "30", "operator": null }
```

### `SignedNumberTypeClass`（signedNumber.ts）

- **type**: `'signedNumber'`
- **継承**: `PrimitiveLiteralTypeClass<string>`
- **元 Context**: `SignedNumberContext`（文法: `(ADD | SUB)? (IntegerLiteral | NumberLiteral)`）
- **役割**: 符号付き数値。SOQL の比較値や位置座標に使われる。

| 変数        | 型               | 内容                                     |
| ----------- | ---------------- | ---------------------------------------- |
| `type`      | `'signedNumber'` | 継承                                     |
| `valueType` | `string`         | `'integer'` \| `'number'`                |
| `value`     | `string`         | 数値トークンのテキスト（符号は含まない） |
| `operator`  | `string \| null` | `'+'` \| `'-'`。符号なしは `null`        |

ゲッター: `getValue()`, `getValueType()`, `getOperator()`

例:

```apex
AND AnnualRevenue >= 1000
AND AnnualRevenue <= -1.5
```

```json
{"type":"signedNumber","valueType":"integer","value":"1000","operator":null}
{"type":"signedNumber","valueType":"number","value":"1.5","operator":"-"}
```

### `SoqlLiteralTypeClass`（soqlLiteral.ts）

- **type**: `'soqlLiteral'`
- **継承**: `LiteralTypeClass<NormalQueryTypeClass>`
- **元 Context**: `SoqlLiteralContext`（文法: `LBRACK query RBRACK`）
- **役割**: `[...]` で囲まれた SOQL。クエリ本体を `value` に持つ。

| 変数    | 型                                       | 内容                |
| ------- | ---------------------------------------- | ------------------- |
| `type`  | `'soqlLiteral'`                          | 継承                |
| `value` | `NormalQueryTypeClass \| ErrorTypeClass` | クエリ（`'query'`） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM Account ...]
```

```json
{
    "type": "soqlLiteral",
    "value": {
        "type": "query",
        "value": { "type": "selectList", "value": "..." },
        "from": { "type": "fromNameList", "value": "..." },
        "whereClause": null,
        "...": "..."
    }
}
```

### `SoslLiteralTypeClass`（soslLiteral.ts）

- **type**: `'soslLiteral'`
- **継承**: `LiteralTypeClass<string | BoundExpressionTypeClass>`
- **元 Context**: `SoslLiteralContext`（文法: `FindLiteral soslClauses RBRACK | LBRACK FIND boundExpression soslClauses RBRACK`）
- **役割**: `[FIND ...]` 形式の SOSL。検索語と SOSL 句を保持する。

| 変数          | 型                                                     | 内容                                                                                                                                                                   |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`        | `'soslLiteral'`                                        | 継承                                                                                                                                                                   |
| `value`       | `string \| BoundExpressionTypeClass \| ErrorTypeClass` | 検索語が文字列の場合は `FindLiteral` トークンのテキスト（`[FIND` を含む。例 `"[FIND 'test'"`）。`FIND :var` の場合は `BoundExpressionTypeClass`（`'boundExpression'`） |
| `soslClauses` | `SoslClausesTypeClass \| ErrorTypeClass`               | `IN` / `RETURNING` / `WITH` / `LIMIT` 等の句（`'soslClauses'`）                                                                                                        |

ゲッター: `getValue()`, `getSoslClauses()`

例:

```apex
[FIND 'test' IN ALL FIELDS RETURNING Account, Contact]
[FIND :keyword IN NAME FIELDS RETURNING ...]
```

```json
{"type":"soslLiteral","value":"[FIND 'test'","soslClauses":{"type":"soslClauses","value":{"type":"searchGroup","value":"ALL"},"fieldSpecList":{"type":"fieldSpecList","value":"..."},"withList":null,"limitClause":null,"updateList":null}}
{"type":"soslLiteral","value":{"type":"boundExpression","value":{"type":"primaryExpression","value":"..."}},"soslClauses":{"type":"soslClauses","value":{"type":"searchGroup","value":"NAME"},"...":"..."}}
```

### `SoslLiteralAltTypeClass`（soslLiteralAlt.ts）

- **type**: `'soslLiteralAlt'`
- **継承**: `LiteralTypeClass<string>`
- **元 Context**: `SoslLiteralAltContext`（文法: `FindLiteralAlt soslClauses RBRACK`）
- **役割**: `FindLiteralAlt` トークン（`{...}` 形式の検索語）を使う SOSL。リポジトリ内に `isSoslLiteralAltType` を使う呼び出し元は無い。

| 変数          | 型                                       | 内容                                |
| ------------- | ---------------------------------------- | ----------------------------------- |
| `type`        | `'soslLiteralAlt'`                       | 継承                                |
| `value`       | `string`                                 | `FindLiteralAlt` トークンのテキスト |
| `soslClauses` | `SoslClausesTypeClass \| ErrorTypeClass` | SOSL 句（`'soslClauses'`）          |

ゲッター: `getValue()`, `getSoslClauses()`

例: 例 IR には出現しない。
