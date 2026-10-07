# listVisitor

カンマ区切りの並び（型引数・実引数・仮引数・SOQL/SOSL の項目リストなど）を、要素の配列を `value` に持つ IR に変換する。文法上再帰で表現されるリスト（`fieldList` / `fieldSpecList` / `networkList` / `updateList`）は 1 つの配列に平坦化する。

## Visitor

| visit メソッド             | Context                      | 生成する TypeClass             |
| -------------------------- | ---------------------------- | ------------------------------ |
| `visitTypeList`            | `TypeListContext`            | `TypeListTypeClass`            |
| `visitExpressionList`      | `ExpressionListContext`      | `ExpressionListTypeClass`      |
| `visitFormalParameterList` | `FormalParameterListContext` | `FormalParameterListTypeClass` |
| `visitValueList`           | `ValueListContext`           | `ValueListTypeClass`           |
| `visitFieldNameList`       | `FieldNameListContext`       | `FieldNameListTypeClass`       |
| `visitUpdateList`          | `UpdateListContext`          | `UpdateListTypeClass`          |
| `visitNetworkList`         | `NetworkListContext`         | `NetworkListTypeClass`         |
| `visitFromNameList`        | `FromNameListContext`        | `FromNameListTypeClass`        |
| `visitFieldGroupByList`    | `FieldGroupByListContext`    | `FieldGroupByListTypeClass`    |
| `visitFieldOrderList`      | `FieldOrderListContext`      | `FieldOrderListTypeClass`      |
| `visitSelectList`          | `SelectListContext`          | `SelectListTypeClass`          |
| `visitSubFieldList`        | `SubFieldListContext`        | `SubFieldListTypeClass`        |
| `visitFieldList`           | `FieldListContext`           | `FieldListTypeClass`           |
| `visitFieldSpecList`       | `FieldSpecListContext`       | `FieldSpecListTypeClass`       |

`ListVisitor` は `CommonVisitor<ListTypeClass<unknown>>` を継承する。`create()` が例外を投げた場合や子要素が無い場合は `ErrorTypeClass` が返る。

## 基底クラス（base.ts）

### `ListTypeClass<T>`

listVisitor の全 TypeClass の基底。要素の配列を `value` に持つ。

| 変数    | 型                        | 内容                                                                         |
| ------- | ------------------------- | ---------------------------------------------------------------------------- |
| `type`  | `string`                  | ノード種別（CommonTypeClass から継承）                                       |
| `value` | `(T \| ErrorTypeClass)[]` | 要素の配列（ソース順）。型不一致の要素は個別に `ErrorTypeClass` に置き換わる |

ゲッター: `getType()`, `getValue()`

### `isListTypeAll`（ガード関数）

`target instanceof ListTypeClass` を返す（`target is ListTypeClass<unknown>`）。

## TypeClass

### `ExpressionListTypeClass`（expressionList.ts）

- **type**: `'expressionList'`
- **継承**: `ListTypeClass<ExpressionAllTypeClass>`
- **元 Context**: `ExpressionListContext`（文法: `expression (, expression)*`）
- **役割**: メソッド呼び出しなどの実引数リスト。

| 変数    | 型                                             | 内容                   |
| ------- | ---------------------------------------------- | ---------------------- |
| `type`  | `'expressionList'`                             | 継承                   |
| `value` | `(ExpressionAllTypeClass \| ErrorTypeClass)[]` | 各引数の式（1 件以上） |

ゲッター: `getValue()`

例:

```apex
System.debug(value);
```

```json
{
    "type": "expressionList",
    "value": [{ "type": "primaryExpression", "value": { "type": "idPrimary", "value": "..." } }]
}
```

### `FieldGroupByListTypeClass`（fieldGroupByList.ts）

- **type**: `'fieldGroupByList'`
- **継承**: `ListTypeClass<FieldGroupByTypeClass>`
- **元 Context**: `FieldGroupByListContext`（文法: `fieldGroupBy (, fieldGroupBy)*`）
- **役割**: GROUP BY の項目リスト。

| 変数    | 型                                            | 内容                       |
| ------- | --------------------------------------------- | -------------------------- |
| `type`  | `'fieldGroupByList'`                          | 継承                       |
| `value` | `(FieldGroupByTypeClass \| ErrorTypeClass)[]` | グループ化項目（1 件以上） |

ゲッター: `getValue()`

例:

```apex
GROUP BY Industry
```

```json
{
    "type": "fieldGroupByList",
    "value": [{ "type": "fieldGroupBy", "value": { "type": "fieldName", "value": "..." } }]
}
```

### `FieldListTypeClass`（fieldList.ts）

- **type**: `'fieldList'`
- **継承**: `ListTypeClass<SoslFieldTypeClass>`
- **元 Context**: `FieldListContext`（文法概略: `(soslId | TOLABEL(soslId) | CONVERT_CURRENCY(soslId) | FORMAT(soslId) | soqlFunction) (, fieldList)*`）
- **役割**: SOSL `RETURNING Obj(...)` の括弧内の取得項目。再帰する `fieldList` は 1 つの配列に平坦化し、各項目は自身の関数指定を `SoslFieldTypeClass` として保持する。

| 変数    | 型                                         | 内容                                                                                                                                 |
| ------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `type`  | `'fieldList'`                              | 継承                                                                                                                                 |
| `value` | `(SoslFieldTypeClass \| ErrorTypeClass)[]` | 項目。各階層で `soslId` があればそれを、無ければ `soqlFunction` を `soslField` として追加し、続けて入れ子の `fieldList` の要素を追加 |

ゲッター: `getValue()`

例:

```apex
RETURNING Contact(Id, TOLABEL(Type))
```

```json
{
    "type": "fieldList",
    "span": { "...": "..." },
    "value": [
        {
            "type": "soslField",
            "span": { "...": "..." },
            "value": { "type": "soslId", "span": { "...": "..." }, "value": ["..."] },
            "func": null
        },
        {
            "type": "soslField",
            "span": { "...": "..." },
            "value": { "type": "soslId", "span": { "...": "..." }, "value": ["..."] },
            "func": "TOLABEL"
        }
    ]
}
```

### `SoslFieldTypeClass`（fieldList.ts）

- **type**: `'soslField'`
- **継承**: `CommonTypeClass`
- **元 Context**: なし（Visitor ではなく `FieldListTypeClass` が直接生成する）
- **役割**: SOSL `fieldList` の項目 1 件と、それに付いた関数指定の組。`span` は `value` の範囲。

| 変数    | 型                                                           | 内容                                                                  |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `type`  | `'soslField'`                                                | 継承                                                                  |
| `value` | `SoslIdTypeClass \| SoqlFunctionTypeClass \| ErrorTypeClass` | 項目名、または関数                                                    |
| `func`  | `'TOLABEL' \| 'CONVERT_CURRENCY' \| 'FORMAT' \| null`        | 項目を囲む `TOLABEL` / `CONVERT_CURRENCY` / `FORMAT`。無ければ `null` |

ゲッター: `getValue()`, `getFunc()`

ガード関数: `isSoslFieldType`

### `FieldNameListTypeClass`（fieldNameList.ts）

- **type**: `'fieldNameList'`
- **継承**: `ListTypeClass<FieldNameTypeClass>`
- **元 Context**: `FieldNameListContext`（文法: `fieldName (, fieldName)*`）
- **役割**: `TYPEOF` の THEN / ELSE の項目リスト。

| 変数    | 型                                         | 内容               |
| ------- | ------------------------------------------ | ------------------ |
| `type`  | `'fieldNameList'`                          | 継承               |
| `value` | `(FieldNameTypeClass \| ErrorTypeClass)[]` | 項目名（1 件以上） |

ゲッター: `getValue()`

例:

```apex
ELSE Name
```

```json
{ "type": "fieldNameList", "value": [{ "type": "fieldName", "value": ["..."] }] }
```

### `FieldOrderListTypeClass`（fieldOrderList.ts）

- **type**: `'fieldOrderList'`
- **継承**: `ListTypeClass<FieldOrderTypeClass>`
- **元 Context**: `FieldOrderListContext`（文法: `fieldOrder (, fieldOrder)*`）
- **役割**: ORDER BY の項目リスト（SOQL / SOSL fieldSpec 共通）。

| 変数    | 型                                          | 内容                     |
| ------- | ------------------------------------------- | ------------------------ |
| `type`  | `'fieldOrderList'`                          | 継承                     |
| `value` | `(FieldOrderTypeClass \| ErrorTypeClass)[]` | 並び替え項目（1 件以上） |

ゲッター: `getValue()`

例:

```apex
ORDER BY LastName
```

```json
{
    "type": "fieldOrderList",
    "value": [
        {
            "type": "fieldOrder",
            "value": { "type": "fieldName", "value": "..." },
            "direction": null,
            "nulls": null
        }
    ]
}
```

### `FieldSpecListTypeClass`（fieldSpecList.ts）

- **type**: `'fieldSpecList'`
- **継承**: `ListTypeClass<FieldSpecTypeClass>`
- **元 Context**: `FieldSpecListContext`（文法: `fieldSpec (, fieldSpecList)*`）
- **役割**: SOSL `RETURNING` の対象オブジェクト一覧。再帰する `fieldSpecList` は 1 つの配列に平坦化する。

| 変数    | 型                                         | 内容                         |
| ------- | ------------------------------------------ | ---------------------------- |
| `type`  | `'fieldSpecList'`                          | 継承                         |
| `value` | `(FieldSpecTypeClass \| ErrorTypeClass)[]` | 対象オブジェクト（1 件以上） |

ゲッター: `getValue()`

例:

```apex
RETURNING Contact
```

```json
{
    "type": "fieldSpecList",
    "value": [
        {
            "type": "fieldSpec",
            "value": { "type": "soslId", "value": "..." },
            "fieldList": null,
            "where": null,
            "listView": null,
            "orderBy": null,
            "limitClause": null,
            "offsetClause": null
        }
    ]
}
```

### `FormalParameterListTypeClass`（formalParameterList.ts）

- **type**: `'formalParameterList'`
- **継承**: `ListTypeClass<FormalParameterTypeClass>`
- **元 Context**: `FormalParameterListContext`（文法: `formalParameter (, formalParameter)*`）
- **役割**: メソッド / コンストラクタの仮引数リスト。

| 変数    | 型                                               | 内容               |
| ------- | ------------------------------------------------ | ------------------ |
| `type`  | `'formalParameterList'`                          | 継承               |
| `value` | `(FormalParameterTypeClass \| ErrorTypeClass)[]` | 仮引数（1 件以上） |

ゲッター: `getValue()`

例:

```apex
private void runAsExample(User user) { ... }
```

```json
{
    "type": "formalParameterList",
    "value": [
        {
            "type": "formalParameter",
            "value": { "type": "id", "value": "user" },
            "valueType": { "type": "typeRef", "...": "..." },
            "modifier": []
        }
    ]
}
```

### `FromNameListTypeClass`（fromNameList.ts）

- **type**: `'fromNameList'`
- **継承**: `ListTypeClass<FromNameTypeClass>`
- **元 Context**: `FromNameListContext`（文法: `fieldName soqlId? (, fieldName soqlId?)*`）
- **役割**: SOQL の FROM 対象。各 `fieldName` と直後の `soqlId`（エイリアス）を `FromNameTypeClass` として組にする。

| 変数    | 型                                        | 内容                                                 |
| ------- | ----------------------------------------- | ---------------------------------------------------- |
| `type`  | `'fromNameList'`                          | 継承                                                 |
| `value` | `(FromNameTypeClass \| ErrorTypeClass)[]` | オブジェクト名とエイリアスの組（ソース順、1 件以上） |

ゲッター: `getValue()`

`fieldName` が 1 件も無い場合は例外（→ `ErrorTypeClass`）。

例:

```apex
FROM Account a
```

```json
{
    "type": "fromNameList",
    "span": { "...": "..." },
    "value": [
        {
            "type": "fromName",
            "span": { "...": "..." },
            "value": { "type": "fieldName", "span": { "...": "..." }, "value": ["..."] },
            "alias": {
                "type": "soqlId",
                "span": { "...": "..." },
                "value": { "type": "id", "span": { "...": "..." }, "value": "a" }
            }
        }
    ]
}
```

### `FromNameTypeClass`（fromNameList.ts）

- **type**: `'fromName'`
- **継承**: `CommonTypeClass`
- **元 Context**: なし（Visitor ではなく `FromNameListTypeClass` が直接生成する）
- **役割**: FROM 対象 1 件（`Account a` の `Account` と `a` の組）。`span` はオブジェクト名の先頭からエイリアス（無ければオブジェクト名）の末尾まで。

| 変数    | 型                                          | 内容                        |
| ------- | ------------------------------------------- | --------------------------- |
| `type`  | `'fromName'`                                | 継承                        |
| `value` | `FieldNameTypeClass \| ErrorTypeClass`      | オブジェクト名              |
| `alias` | `SoqlIdTypeClass \| ErrorTypeClass \| null` | エイリアス。無ければ `null` |

ゲッター: `getValue()`, `getAlias()`

ガード関数: `isFromNameType`

### `NetworkListTypeClass`（networkList.ts）

- **type**: `'networkList'`
- **継承**: `ListTypeClass<string>`
- **元 Context**: `NetworkListContext`（文法: `(StringLiteral | MultilineStringLiteral) (, networkList)?`）
- **役割**: SOSL `WITH NETWORK IN (...)` のネットワーク ID 一覧。再帰する `networkList` は 1 つの配列に平坦化する。

| 変数    | 型                             | 内容                                   |
| ------- | ------------------------------ | -------------------------------------- |
| `type`  | `'networkList'`                | 継承                                   |
| `value` | `(string \| ErrorTypeClass)[]` | 文字列リテラルのテキスト（引用符付き） |

ゲッター: `getValue()`

例:

```apex
WITH NETWORK IN ('0DBxx0000000001', '0DBxx0000000002')
```

```json
{ "type": "networkList", "value": ["'0DBxx0000000001'", "'0DBxx0000000002'"] }
```

### `SelectListTypeClass`（selectList.ts）

- **type**: `'selectList'`
- **継承**: `ListTypeClass<SelectEntryTypeClass>`
- **元 Context**: `SelectListContext`（文法: `selectEntry (, selectEntry)*`）
- **役割**: トップレベル `query` の SELECT 項目リスト。

| 変数    | 型                                           | 内容                    |
| ------- | -------------------------------------------- | ----------------------- |
| `type`  | `'selectList'`                               | 継承                    |
| `value` | `(SelectEntryTypeClass \| ErrorTypeClass)[]` | SELECT 項目（1 件以上） |

ゲッター: `getValue()`

例:

```apex
[SELECT COUNT() FROM Account]
```

```json
{
    "type": "selectList",
    "value": [
        {
            "type": "selectEntry",
            "value": { "type": "soqlFunction", "value": "COUNT", "param": null },
            "alias": null
        }
    ]
}
```

### `SubFieldListTypeClass`（subFieldList.ts）

- **type**: `'subFieldList'`
- **継承**: `ListTypeClass<SubFieldEntryTypeClass>`
- **元 Context**: `SubFieldListContext`（文法: `subFieldEntry (, subFieldEntry)*`）
- **役割**: `subQuery` の SELECT 項目リスト。

| 変数    | 型                                             | 内容                    |
| ------- | ---------------------------------------------- | ----------------------- |
| `type`  | `'subFieldList'`                               | 継承                    |
| `value` | `(SubFieldEntryTypeClass \| ErrorTypeClass)[]` | SELECT 項目（1 件以上） |

ゲッター: `getValue()`

例:

```apex
OwnerId IN (SELECT Id FROM User WHERE IsActive = true)
```

```json
{
    "type": "subFieldList",
    "value": [
        { "type": "subFieldEntry", "value": { "type": "fieldName", "value": "..." }, "alias": null }
    ]
}
```

### `TypeListTypeClass`（typeList.ts）

- **type**: `'typeList'`
- **継承**: `ListTypeClass<TypeRefTypeClass>`
- **元 Context**: `TypeListContext`（文法: `typeRef (, typeRef)*`）
- **役割**: 型引数（`<...>` の中身）や `implements` / `extends` の型リスト。

| 変数    | 型                                       | 内容               |
| ------- | ---------------------------------------- | ------------------ |
| `type`  | `'typeList'`                             | 継承               |
| `value` | `(TypeRefTypeClass \| ErrorTypeClass)[]` | 型参照（1 件以上） |

ゲッター: `getValue()`

例:

```apex
Map<Id, Account>
```

```json
{
    "type": "typeList",
    "value": [
        {
            "type": "typeRef",
            "value": ["..."],
            "dimension": { "type": "arraySubscripts", "value": 0 }
        },
        {
            "type": "typeRef",
            "value": ["..."],
            "dimension": { "type": "arraySubscripts", "value": 0 }
        }
    ]
}
```

### `UpdateListTypeClass`（updateList.ts）

- **type**: `'updateList'`
- **継承**: `ListTypeClass<UpdateTypeTypeClass>`
- **元 Context**: `UpdateListContext`（文法: `updateType (, updateList)?`）
- **役割**: SOQL / SOSL の `UPDATE TRACKING, VIEWSTAT`。再帰する `updateList` は 1 つの配列に平坦化する。

| 変数    | 型                                          | 内容                     |
| ------- | ------------------------------------------- | ------------------------ |
| `type`  | `'updateList'`                              | 継承                     |
| `value` | `(UpdateTypeTypeClass \| ErrorTypeClass)[]` | `updateType`（1 件以上） |

ゲッター: `getValue()`

例:

```apex
[SELECT Id FROM FAQ__kav UPDATE TRACKING, VIEWSTAT]
```

```json
{
    "type": "updateList",
    "value": [
        { "type": "updateType", "value": "TRACKING" },
        { "type": "updateType", "value": "VIEWSTAT" }
    ]
}
```

### `ValueListTypeClass`（valueList.ts）

- **type**: `'valueList'`
- **継承**: `ListTypeClass<NormalValueTypeClass>`
- **元 Context**: `ValueListContext`（文法: `( value (, value)* )`）
- **役割**: WHERE 句の `IN (...)` / `INCLUDES (...)` などの値リスト。

| 変数    | 型                                           | 内容           |
| ------- | -------------------------------------------- | -------------- |
| `type`  | `'valueList'`                                | 継承           |
| `value` | `(NormalValueTypeClass \| ErrorTypeClass)[]` | 値（1 件以上） |

ゲッター: `getValue()`

例:

```apex
AND Industry IN ('Technology', 'Finance')
```

```json
{
    "type": "valueList",
    "value": [
        { "type": "value", "value": "'Technology'", "valueType": "string" },
        { "type": "value", "value": "'Finance'", "valueType": "string" }
    ]
}
```
