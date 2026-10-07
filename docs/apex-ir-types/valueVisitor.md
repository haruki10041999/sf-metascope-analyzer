# valueVisitor

SOQL の比較右辺の値、`switch` の `when` 値、アノテーション引数の値、SOQL `DISTANCE` / `GEOLOCATION` の位置・座標値を IR に変換する。

## Visitor

| visit メソッド         | Context                  | 生成する TypeClass         |
| ---------------------- | ------------------------ | -------------------------- |
| `visitValue`           | `ValueContext`           | `NormalValueTypeClass`     |
| `visitElementValue`    | `ElementValueContext`    | `ElementValueTypeClass`    |
| `visitWhenValue`       | `WhenValueContext`       | `WhenValueTypeClass`       |
| `visitCoordinateValue` | `CoordinateValueContext` | `CoordinateValueTypeClass` |
| `visitLocationValue`   | `LocationValueContext`   | `LocationValueTypeClass`   |

`ValueVisitor` は `CommonVisitor<ValueTypeClass<unknown>>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `ValueTypeClass<T>`

valueVisitor の全 TypeClass の基底。`type` と単一の `value` を持つ。

| 変数    | 型                    | 内容                                   |
| ------- | --------------------- | -------------------------------------- |
| `type`  | `string`              | ノード種別（CommonTypeClass から継承） |
| `value` | `T \| ErrorTypeClass` | 値の本体                               |

ゲッター: `getType()`, `getValue()`

### `isValueTypeAll`（ガード関数）

`target instanceof ValueTypeClass` を返す（`target is ValueTypeClass<unknown>`）。

## TypeClass

### `CoordinateValueTypeClass`（coordinateValue.ts）

- **type**: `'coordinateValue'`
- **継承**: `ValueTypeClass<SignedNumberTypeClass | BoundExpressionTypeClass>`
- **元 Context**: `CoordinateValueContext`（文法: `signedNumber | boundExpression`）
- **役割**: `GEOLOCATION(緯度, 経度)` の座標 1 つ。

| 変数    | 型                                                                    | 内容                        |
| ------- | --------------------------------------------------------------------- | --------------------------- |
| `type`  | `'coordinateValue'`                                                   | 継承                        |
| `value` | `SignedNumberTypeClass \| BoundExpressionTypeClass \| ErrorTypeClass` | 数値リテラル、または `:var` |

ゲッター: `getValue()`

例:

```apex
GEOLOCATION(37.775, -122.418)
```

```json
{
    "type": "coordinateValue",
    "value": { "type": "signedNumber", "valueType": "number", "value": "37.775", "operator": null }
}
```

### `ElementValueTypeClass`（elementValue.ts）

- **type**: `'elementValue'`
- **継承**: `ValueTypeClass<NormalLiteralTypeClass>`
- **元 Context**: `ElementValueContext`（文法: `literal`）
- **役割**: アノテーション引数（`@Xxx(key=value)` の `value`）。

| 変数    | 型                                         | 内容     |
| ------- | ------------------------------------------ | -------- |
| `type`  | `'elementValue'`                           | 継承     |
| `value` | `NormalLiteralTypeClass \| ErrorTypeClass` | リテラル |

ゲッター: `getValue()`

例:

```apex
@AuraEnabled(cacheable=true)
```

```json
{ "type": "elementValue", "value": { "type": "literal", "valueType": "boolean", "value": "true" } }
```

### `LocationValueTypeClass`（locationValue.ts）

- **type**: `'locationValue'`
- **継承**: `ValueTypeClass<FieldNameTypeClass | BoundExpressionTypeClass | null>`
- **元 Context**: `LocationValueContext`（文法: `fieldName | boundExpression | GEOLOCATION ( coordinateValue , coordinateValue )`）
- **役割**: SOQL `DISTANCE(...)` の位置引数。

| 変数          | 型                                                                         | 内容                                                                |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `type`        | `'locationValue'`                                                          | 継承                                                                |
| `value`       | `FieldNameTypeClass \| BoundExpressionTypeClass \| ErrorTypeClass \| null` | 位置項目名 / `:var`。`GEOLOCATION(...)` 形式では `null`             |
| `coordinates` | `(CoordinateValueTypeClass \| ErrorTypeClass)[] \| null`                   | `GEOLOCATION(...)` 形式のときのみ `[緯度, 経度]`。それ以外は `null` |

ゲッター: `getValue()`, `getCoordinates()`

`fieldName` / `boundExpression` が無く、`GEOLOCATION` と 2 件の `coordinateValue` も揃っていない場合は例外（→ `ErrorTypeClass`）。

例:

```apex
DISTANCE(BillingAddress, GEOLOCATION(37.775, -122.418), 'km')
```

```json
{
    "type": "locationValue",
    "span": { "...": "..." },
    "value": null,
    "coordinates": [
        {
            "type": "coordinateValue",
            "span": { "...": "..." },
            "value": {
                "type": "signedNumber",
                "valueType": "number",
                "value": "37.775",
                "operator": null
            }
        },
        {
            "type": "coordinateValue",
            "span": { "...": "..." },
            "value": {
                "type": "signedNumber",
                "valueType": "number",
                "value": "122.418",
                "operator": "-"
            }
        }
    ]
}
```

### `NormalValueTypeClass`（normal.ts）

- **type**: `'value'`
- **継承**: `ValueTypeClass<ValueTypeClassValue>`（`ValueTypeClassValue` = `string | SignedNumberTypeClass | DateFormulaTypeClass | SubQueryTypeClass | ValueListTypeClass | BoundExpressionTypeClass`）
- **元 Context**: `ValueContext`（文法概略: `NULL | BooleanLiteral | signedNumber | StringLiteral | MultilineStringLiteral | DateLiteral | TimeLiteral | DateTimeLiteral | dateFormula | IntegralCurrencyLiteral ... | ( subQuery ) | valueList | boundExpression`）
- **役割**: SOQL WHERE / HAVING の比較右辺の値。

| 変数        | 型                                      | 内容                                     |
| ----------- | --------------------------------------- | ---------------------------------------- |
| `type`      | `'value'`                               | 継承                                     |
| `value`     | `ValueTypeClassValue \| ErrorTypeClass` | 値（`valueType` により型が決まる、下記） |
| `valueType` | `string`                                | 値の種類（下記）                         |

| `valueType`                        | `value`                                  |
| ---------------------------------- | ---------------------------------------- |
| `'null'`                           | 文字列 `'null'`                          |
| `'boolean'`                        | `'true'` / `'false'` のテキスト          |
| `'signedNumber'`                   | `SignedNumberTypeClass`                  |
| `'string'`                         | 文字列リテラルのテキスト（引用符付き）   |
| `'multilineString'`                | 複数行文字列リテラルのテキスト           |
| `'date'` / `'time'` / `'dateTime'` | 日付・時刻リテラルのテキスト             |
| `'dateFormula'`                    | `DateFormulaTypeClass`                   |
| `'integralCurrency'`               | 通貨リテラル（`USD5000` など）のテキスト |
| `'integer'`                        | 整数リテラルのテキスト                   |
| `'subQuery'`                       | `SubQueryTypeClass`（`IN (SELECT ...)`） |
| `'valueList'`                      | `ValueListTypeClass`（`IN ('a', 'b')`）  |
| `'boundExpression'`                | `BoundExpressionTypeClass`（`:var`）     |

ゲッター: `getValue()`, `getValueType()`

例:

```apex
AND CreatedDate = TODAY
AND LastModifiedDate > 2026-01-01T00:00:00Z
```

```json
{
    "type": "value",
    "value": { "type": "dateFormula", "value": "TODAY", "param": null },
    "valueType": "dateFormula"
}
```

```json
{ "type": "value", "value": "2026-01-01T00:00:00Z", "valueType": "dateTime" }
```

### `WhenValueTypeClass`（whenValue.ts）

- **type**: `'whenValue'`
- **継承**: `ValueTypeClass<WhenValueValueType>`（`WhenValueValueType` = `(WhenLiteralTypeClass | ErrorTypeClass)[] | NormalIdTypeClass | 'else'`）
- **元 Context**: `WhenValueContext`（文法: `ELSE | whenLiteral (, whenLiteral)* | typeRef id`）
- **役割**: `switch on` の `when` に続く値。

| 変数        | 型                                           | 内容                                                                                                                               |
| ----------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `type`      | `'whenValue'`                                | 継承                                                                                                                               |
| `value`     | `WhenValueValueType \| ErrorTypeClass`       | `when else` は `'else'`、リテラル列（`when 'B', 'C'` / enum 値）は `whenLiteral` の配列、型判定（`when Account a`）は変数名の `id` |
| `valueType` | `TypeRefTypeClass \| ErrorTypeClass \| null` | 型判定形式のときの型。それ以外は `null`                                                                                            |

ゲッター: `getValue()`, `getValueType()`

例:

```apex
switch on input {
    when Account a { ... }
}
```

```json
{
    "type": "whenValue",
    "value": { "type": "id", "value": "a" },
    "valueType": {
        "type": "typeRef",
        "value": [{ "type": "typeName", "value": "...", "generic": null }],
        "dimension": { "type": "arraySubscripts", "value": 0 }
    }
}
```
